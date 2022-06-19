.<template>
  <div id="approot">
    <div class="title">GPS EXIFR</div>
    <table style="margin: auto;">
      <tr>
        <td><button class="inputbtn" v-on:click="selectimagesdir" v-bind:disabled="exifing">Select Images Folder</button></td>
        <td><button class="inputbtn" v-on:click="selectcsvfile" v-bind:disabled="exifing">Select CSV File</button></td>
      </tr>
      <tr>
        <td><span>{{ imagesdirdisplay }}</span></td>
        <td><span>{{ csvpathdisplay }}</span></td>
      </tr>
    </table>

    <table style="margin: auto;" v-show="csvLoaded">
      <tr>
        <td>
          <span>Has Header</span>&emsp;<input type="checkbox" v-model="hasHeader" v-bind:disabled="!csvLoaded">
        </td>
      </tr>
    </table>
    <table style="margin: auto;" v-show="csvLoaded">
      <tr>
        <td>
          <span>Image Name</span>
        </td><td>
          <select v-model="imgnamecolumn">
            <option disabled value="">Select Column</option>
            <option v-for="(col, index) in columnList" v-bind:key="index">{{ col }}</option>
          </select>
        </td>
        <td>
          <span>Longitude</span>
        </td><td>
          <select v-model="longitudecolumn">
            <option disabled value="">Select Column</option>
            <option v-for="(col, index) in columnList" v-bind:key="index">{{ col }}</option>
          </select>
        </td>
      </tr>
      <tr>
        <td>
          <span>Latitude</span>
        </td><td>
          <select v-model="latitudecolumn">
            <option disabled value="">Select Column</option>
            <option v-for="(col, index) in columnList" v-bind:key="index">{{ col }}</option>
          </select>
        </td>
        <td>
          <span>Altitude</span>
        </td><td>
          <select v-model="altitudeecolumn">
            <option disabled value="">Select Column</option>
            <option v-for="(col, index) in columnList" v-bind:key="index">{{ col }}</option>
          </select>
        </td>
      </tr>
    </table>
    
    <br>
    <div class="clientmsg">Images Total: {{ totalimages }} &emsp; Geotagged: {{ geoimages }}</div>
    <div class="clientmsg">{{ statusmsg }}</div>
    <button class="cmdbtn" v-on:click="startexifing" v-bind:disabled="exifing">XIF GPS</button>
    <button class="cmdbtn" v-on:click="exitnow">Exit</button>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted } from 'vue';
import { ref } from '@vue/reactivity';
import './App.scss';

import fs from 'fs';
import path from 'path';

import { ipcRenderer } from 'electron';
import { parse } from 'csv-parse/sync';

import { execSync } from 'child_process';

export default defineComponent({
  setup() {
    const imagesdir = ref('');
    const csvpath = ref('');

    const totalimages = ref(0);
    const geoimages = ref(0);

    const imagesdirdisplay = ref('X://folder');
    const csvpathdisplay = ref('Y://file.csv');

    const defaultMsg = 'Click XIF to Start';
    const statusmsg = ref(defaultMsg);

    const csvLoaded = ref(false);
    const hasHeader = ref(false);

    const imgnamecolumn = ref();
    const longitudecolumn = ref();
    const latitudecolumn = ref();
    const altitudeecolumn = ref();

    const csvContentParsed = ref();

    const exifing = ref(false);

    const resetColumns = () => {
      imgnamecolumn.value = '';
      longitudecolumn.value = '';
      latitudecolumn.value = '';
      altitudeecolumn.value = '';
    }

    // const columnList = ref(['1', '2', '3', '4']);
    const columnList = computed(() => {
      if (hasHeader.value){
        resetColumns();

        return csvContentParsed.value[0];
      } else {
        setNumericColumns();
        return ['1', '2', '3', '4'];
      }
    });

    const csvParams = {
      hasHeader, csvLoaded,
      imgnamecolumn, longitudecolumn, latitudecolumn, altitudeecolumn, columnList
    };

    const selectimagesdir = () => {
      ipcRenderer.send('open-folder', ['Select Images Folder', 'imagesfolder']);
    }

    const selectcsvfile = () => {
      ipcRenderer.send('open-file', ['Select CSV File', 'csvfile']);
    }

    const showTempMsg = (msg: any, seconds: any) => {
      statusmsg.value = msg;
      setTimeout(() => {
        statusmsg.value = defaultMsg;
      }, seconds * 1000);
    }

    ipcRenderer.on('imagesfolder', (event, arg) => {
      imagesdir.value = arg;

      totalimages.value = fs.readdirSync(arg).length;
      
      let foldername = path.basename(arg);
      imagesdirdisplay.value = foldername.length < 10 ? foldername : foldername.substring(0, 10) + '...';
    });

    ipcRenderer.on('csvfile', (event, arg) => {
      if(path.extname(arg) == '.csv'){
        let filename = path.basename(arg, '.csv');
        csvpathdisplay.value = filename.length < 10 ? filename + '.csv' : filename.substring(0, 10) + '.. .csv';

        csvActions(arg);
      } else {
        showTempMsg('Only CSVs', 2);
      }
    });

    const readCSVNLoad = () => {
      const csvContent = fs.readFileSync(csvpath.value, 'utf-8');
      // console.log(csvContent);

      const csvParsed = parse(csvContent, {
        delimiter: ','
      });

      // console.log(csvParsed);
      csvContentParsed.value = csvParsed;
    }

    const setNumericColumns = () => {
      imgnamecolumn.value = '1';
      longitudecolumn.value = '2';
      latitudecolumn.value = '3';
      altitudeecolumn.value = '4';
    }

    const csvActions = (arg: any) => {
      csvpath.value = arg;
      csvLoaded.value = true;
      hasHeader.value = false;

      readCSVNLoad();
      setNumericColumns();
    }

    const getBinaryPath = () => {
      ipcRenderer.send('binary-path');
    }

    const execPath = ref('');

    ipcRenderer.on('binary-path', (event, arg) => {
      // console.log(arg);
      execPath.value = path.resolve(path.join(arg, './exiv2.exe'));
    });

    onMounted(() => {
      getBinaryPath();
    });

    const degToDmsRational = (degFloat: any) => {
      let secDigits = 5;

      let degAbs = Math.abs(degFloat);
      let minFloat = degAbs % 1 * 60;
      let secFloat = minFloat % 1 * 60;
      let deg = Math.floor(degAbs);
      let min = Math.floor(minFloat);
      let sec = Math.round(secFloat * 10 ** secDigits);

      return `${deg}/1 ${min}/1 ${sec}/${10 ** secDigits}`;
    }

    const modifyExif = (imagename: any, longitude: any, latitude: any, altitude: any) => {
      let exifArray: any = [];
      exifArray.push('-M"set Exif.GPSInfo.GPSVersionID 2 3 0 0"');
      exifArray.push('-M"set Exif.GPSInfo.GPSLatitudeRef N"');
      exifArray.push(`-M"set Exif.GPSInfo.GPSLatitude ${degToDmsRational(latitude)}"`);
      exifArray.push('-M"set Exif.GPSInfo.GPSLongitudeRef E"');
      exifArray.push(`-M"set Exif.GPSInfo.GPSLongitude ${degToDmsRational(longitude)}"`);
      exifArray.push('-M"set Exif.GPSInfo.GPSAltitudeRef 0"');
      exifArray.push(`-M"set Exif.GPSInfo.GPSAltitude ${Math.round(altitude * 1000)}/1000"`);
      exifArray.push('-M"set Exif.GPSInfo.GPSStatus V"');
      exifArray.push('-M"set Exif.GPSInfo.GPSMapDatum WGS-84"');
      exifArray.push('-M"set Exif.GPSInfo.GPSDifferential 0"');

      let exifCLI = exifArray.join(' ');

      let cmd = `${execPath.value} ${exifCLI} ${path.join(imagesdir.value, imagename)}`;
      // console.log(cmd);
      execSync(cmd);
      geoimages.value = geoimages.value + 1;
    }

    const doExif = () => {
      const csvRows = csvContentParsed.value;
      // console.log(csvRows);
      let startIndex = hasHeader.value ? 1 : 0;

      let imgIndex = 0;
      let lonIndex = 1;
      let latIndex = 2;
      let altIndex = 3;
      if(hasHeader.value){
        let headerRow = csvRows[0];
        // console.log(headerRow);

        imgIndex = headerRow.findIndex((x: any) => x == imgnamecolumn.value);
        lonIndex = headerRow.findIndex((x: any) => x == longitudecolumn.value);
        latIndex = headerRow.findIndex((x: any) => x == latitudecolumn.value);
        altIndex = headerRow.findIndex((x: any) => x == altitudeecolumn.value);
      } else {
        imgIndex = parseInt(imgnamecolumn.value) - 1;
        lonIndex = parseInt(longitudecolumn.value) - 1;
        latIndex = parseInt(latitudecolumn.value) - 1;
        altIndex = parseInt(altitudeecolumn.value) - 1;
      }

      for(let i = startIndex; i < csvRows.length; i++){
        let imagename = csvRows[i][imgIndex];
        let longitude = csvRows[i][lonIndex];
        let latitude = csvRows[i][latIndex];
        let altitude = csvRows[i][altIndex];

        // console.log(imagename, longitude, latitude, altitude);
        modifyExif(imagename, longitude, latitude, altitude);
      }

      statusmsg.value = 'Completed';
    }

    const startexifing = () => {
      if(imagesdir.value == ''){
        showTempMsg('Select Images Directory', 2);
        return;
      }

      statusmsg.value = 'Started';
      // exifing.value = true;

      setTimeout(() => {
        doExif();
      }, 500);
    }

    const exitnow = () => {
      ipcRenderer.send('exit-now');
    }

    return {
      statusmsg, imagesdirdisplay, csvpathdisplay, totalimages, geoimages,
      selectimagesdir, selectcsvfile,
      ...csvParams,
      startexifing, exitnow, exifing
    }

  },
})
</script>
