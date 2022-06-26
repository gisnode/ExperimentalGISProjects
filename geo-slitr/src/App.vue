<template>
  <div id="approot">
    <div class="movable">
      <svg xmlns="http://www.w3.org/2000/svg" height="48" width="48"><path d="m24 44-8.15-8.15 2.2-2.2 4.45 4.45v-9.45h3v9.45l4.45-4.45 2.2 2.2ZM11.9 31.9 4 24l7.95-7.95 2.2 2.2L9.9 22.5h9.45v3H9.9l4.2 4.2Zm24.2 0-2.2-2.2 4.2-4.2h-9.4v-3h9.4l-4.2-4.2 2.2-2.2L44 24ZM22.5 19.3V9.9l-4.2 4.2-2.2-2.2L24 4l7.9 7.9-2.2 2.2-4.2-4.2v9.4Z"/></svg>
    </div>
    <div class="title">GEO SLITR</div><br>
    <table style="margin:auto;">
      <tr>
        <td rowspan="2">
          <div class="systeminfo">
            <div>{{ systeminfo1 }}</div>
            <div>{{ systeminfo2 }}</div>
            <div>{{ systeminfo3 }}</div>
          </div>
        </td>
        <td>
          <button class="outfolderbtn" v-on:click="selectoutfolder" v-bind:disabled="running">Output Folder</button>
        </td>
        <td>
          <span class="secondarymsg" v-bind:title="outputfolder">
            {{ getBaseName(outputfolder).length > 20 ? getBaseName(outputfolder).substring(0, 20) + '...' : getBaseName(outputfolder) }}
          </span>
        </td>
      </tr>
      <tr>
        <td>
          <button class="gjsfldrbtn" v-on:click="selectgeojsonsfolder" v-bind:disabled="running">GeoJSONs Folder ({{ totalgjs }})</button>
        </td>
        <td>
          <span class="secondarymsg" v-bind:title="geojsonsfolder">
            {{ getBaseName(geojsonsfolder).length > 20 ? getBaseName(geojsonsfolder).substring(0, 20) + '...' : getBaseName(geojsonsfolder) }}
          </span>
        </td>
      </tr>
    </table>
    <br>

    <div class="sourcefoldertitle">SOURCE FOLDERS:</div>
    <div class="sourcefolders">
      <button class="addbtn" v-on:click="addsourcefolder" v-bind:disabled="running">+</button>
      <div class="folderlistingcontainer">
        <div class="folderlisting" v-for="(folder, index) in sourcefolders" v-bind:key="index">
          <span class="folderpath" v-bind:title="folder.path">
            {{ folder.path.length > 36 ? folder.path.substring(0, 36) + '...' : folder.path }}
          </span>
          <span class="removefolderbtn"><button v-on:click="removefolder" v-bind:id="folder.id" v-bind:disabled="running">-</button></span>
        </div>
      </div>
    </div><br>

    <div class="primarymsg">
      <span>Buffer (m): </span>
      <span><input type="number" v-model="buffer" style="width: 60px;" v-bind:disabled="running" min="0" max="1000"></span>
    </div><br>
    <div class="secondarymsg">Photos Came Across: {{ imagescameacross }}</div>
    <div class="secondarymsg">GeoPhotos Copied: {{ imagescopied }}</div><br>
    <div class="primarymsg">{{ statusmsg }}</div>
    <button class="startbtn" v-on:click="startrunning" v-bind:disabled="running">Start</button>
    <button class="xitbtn" v-on:click="exitnow" id="xitbtn">Exit</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import './App.scss';

import os from 'os';
import path from 'path';
import fs from 'fs';

import { exec } from 'child_process';

import { ipcRenderer } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import fg from 'fast-glob';
import * as turf from '@turf/turf';


export default defineComponent({
  setup() {
    const systeminfo1 = ref('');
    const systeminfo2 = ref('');
    const systeminfo3 = ref('');

    onMounted(() => {
      systeminfo1.value = `HostName: ${os.hostname()} `;
      systeminfo2.value = `User: ${os.userInfo().username}`;
      systeminfo3.value = `Machine: ${os.arch()} ${os.platform()} ${os.endianness()}`;
    });

    const sourcefolders: any = ref([
      { id: '1', path: 'D:/TESTS/slitrtstmed/imgs' }
    ]);

    const running = ref(false);

    const addsourcefolder = () => {
      ipcRenderer.send('open-folder', ['Select Parent Folder', 'sourcefolder']);
    }

    ipcRenderer.on('sourcefolder', (event, arg) => {
      // console.log(arg);
      imagescopied.value = 0;

      const foldersArry = [ ...sourcefolders.value, {
        id: uuidv4(),
        path: arg
      }];
      
      const key = 'path';
      const arrayUniqueByKey = [...new Map(foldersArry.map(folderObj => [folderObj[key], folderObj])).values()];
      sourcefolders.value = arrayUniqueByKey;
    });

    const removefolder = (e: any) => {
      let id = e.target.getAttribute('id');

      const filteredFoldersList = sourcefolders.value.filter((sourcefolder : any) => {
        return sourcefolder.id != id;
      });

      sourcefolders.value = filteredFoldersList;
    }

    const outputfolder = ref('D:/TESTS/slitrtstmed/out');
    const geojsonsfolder = ref('D:/TESTS/slitrtstmed/gjs');
    // const outputfolder = ref('');
    // const geojsonsfolder = ref('');

    const selectoutfolder = () => {
      ipcRenderer.send('open-folder', ['Select Output Folder', 'outputfolder']);
    }

    ipcRenderer.on('outputfolder', (event, arg) => {
      // console.log(arg);
      outputfolder.value = arg;
    });

    const selectgeojsonsfolder = () => {
      ipcRenderer.send('open-folder', ['Select GeoJSONs Folder', 'gjsfolder']);
    }

    const totalgjs = ref(0);

    ipcRenderer.on('gjsfolder', (event, arg) => {
      geojsonsfolder.value = arg;

      calcGeoJSONs(geojsonsfolder.value);
    });

    const calcGeoJSONs = (gjpath: any) => {
      totalgjs.value = fs.readdirSync(gjpath).filter(entry => {
        return path.extname(entry).toLowerCase() == '.geojson'
      }).length;
    }

    const defaultMsg = 'Click on Start';
    const statusmsg = ref(defaultMsg);

    const imagescameacross = ref(0);
    const imagescopied = ref(0);

    const buffer = ref(100);

    const showTempMsg = (msg: any, seconds: any) => {
      statusmsg.value = msg;
      setTimeout(() => {
        statusmsg.value = defaultMsg; 
      }, seconds * 1000);
    }

    const getBaseName = (pathName: any) => {
      return path.basename(pathName);
    }

    const execPath = ref('');

    ipcRenderer.on('binary-path', (event, arg) => {
      // console.log(arg);
      execPath.value = path.resolve(path.join(arg, './exiv2.exe'));
    });

    const getBinaryPath = () => {
      ipcRenderer.send('binary-path');
    }

    onMounted(() => {
      getBinaryPath();
    });

    let gjsObjArry: any = [];
    let gjsCSVInfo: any = {};
    const initialSetup = () => {
      gjsObjArry = [];
      gjsCSVInfo = {};
      
      const gjs = fs.readdirSync(geojsonsfolder.value).filter(entry => {
        return path.extname(entry).toLowerCase() == '.geojson'
      });

      for(let i = 0; i < gjs.length; i++){
        let gjName = path.parse(gjs[i]).name;

        gjsCSVInfo[gjName] = [];

        let gjDir = path.join(outputfolder.value, gjName);
        // console.log(gjDir);

        if (!fs.existsSync(gjDir)){
          fs.mkdirSync(gjDir);
        }

        let gjContent = JSON.parse(fs.readFileSync(path.join(geojsonsfolder.value, gjs[i]), 'utf-8'));
        let bufferedFeature = turf.buffer(gjContent.features[0], buffer.value, { units: 'meters' });

        let gjObj = {
          'name': gjName,
          'dir': gjDir,
          'featbuff': bufferedFeature
        };

        gjsObjArry.push(gjObj);
      }
    }

    const startrunning = () => {
      if(sourcefolders.value.length == 0){
        showTempMsg('Add Source Folders', 2);
        return;
      }

      if(outputfolder.value == ''){
        showTempMsg('Set Output Folder', 2);
        return;
      }

      if(geojsonsfolder.value == ''){
        showTempMsg('Select GeoJSONs Folder', 2);
        return;
      }

      calcGeoJSONs(geojsonsfolder.value);

      if(totalgjs.value == 0){
        showTempMsg('Empty GeoJSONs Folder', 2);
        return;
      }

      initialSetup();

      // console.log(gjsObjArry);

      imagescameacross.value = 0;
      imagescopied.value = 0;

      running.value = true;
      statusmsg.value = 'Running';

      checkNStartCopying();
    }

    
    const checkNStartCopying = async () => {
      for(let i = 0; i < sourcefolders.value.length; i++){
        // console.log(sourcefolders.value[i].path);

        const stream = fg.stream(['**/*.jpg', '**/*.jpeg'], { 
          cwd: sourcefolders.value[i].path,
          caseSensitiveMatch: false,
          suppressErrors: true
        });

        for await (const entry of stream) {
          let imagePath = path.join(sourcefolders.value[i].path, entry.toString());
          // console.log(imagePath);

          await checkNDoCopying(imagePath);
          imagescameacross.value = imagescameacross.value + 1;
        }
      }

      for (let i = 0; i < gjsObjArry.length; i++){
        let gjName = gjsObjArry[i]['name'];
        console.log(gjsCSVInfo[gjName]);
      }

      statusmsg.value = 'Completed';
      running.value = false;
    }

    const checkNDoCopying = (imagePath: any) => new Promise(resolve => {
      try {
        let cmdCLI = `"${execPath.value}" -K Exif.GPSInfo.GPSLongitude -K Exif.GPSInfo.GPSLatitude`;
        cmdCLI += ` -Pv "${imagePath}"`;

        exec(cmdCLI, (error, stdout, stderr) => { 
          // console.log(stdout); console.log(stderr);

          try {
            let gnssInfoParts = stdout.toString().split('\r\n');
            // console.log(gnssInfoParts);
            const gpsLonParts = gnssInfoParts[1].replace(/\s\s+/g, ' ').trim().split(' ');
            let gpsLonD = parseInt(gpsLonParts[0].split('/')[0]) / parseInt(gpsLonParts[0].split('/')[1]);
            let gpsLonM = parseInt(gpsLonParts[1].split('/')[0]) / parseInt(gpsLonParts[1].split('/')[1]);
            let gpsLonS = parseInt(gpsLonParts[2].split('/')[0]) / parseInt(gpsLonParts[2].split('/')[1]);
            let gpsLon = gpsLonD + gpsLonM / 60 + gpsLonS / 3600;
            // console.log(gpsLonParts, gpsLonD, gpsLonM, gpsLonS);

            const gpsLatParts = gnssInfoParts[0].replace(/\s\s+/g, ' ').trim().split(' ');
            let gpsLatD = parseInt(gpsLatParts[0].split('/')[0]) / parseInt(gpsLatParts[0].split('/')[1]);
            let gpsLatM = parseInt(gpsLatParts[1].split('/')[0]) / parseInt(gpsLatParts[1].split('/')[1]);
            let gpsLatS = parseInt(gpsLatParts[2].split('/')[0]) / parseInt(gpsLatParts[2].split('/')[1]);
            let gpsLat = gpsLatD + gpsLatM / 60 + gpsLatS / 3600;
            // console.log(gpsLatParts, gpsLatD, gpsLatM, gpsLatS);
            
            if(isNaN(gpsLon) || isNaN(gpsLat)) {
              resolve(1);
            }

            // let gjObj = {
            //   'name': gjName,
            //   'dir': gjDir,
            //   'featbuff': bufferedFeature
            // };

            // console.log(gpsLon, gpsLat, imagePath);
            const ptFeat = turf.point([gpsLon, gpsLat]);

            for(let i = 0; i < gjsObjArry.length; i++){
              const featbuff = gjsObjArry[i]['featbuff'];
              if(turf.booleanWithin(ptFeat, featbuff)){
                let gjName = gjsObjArry[i]['name'];
                let targetDir = gjsObjArry[i]['dir'];
                let imageName = path.basename(imagePath);

                gjsCSVInfo[gjName] = [
                  ...gjsCSVInfo[gjName],
                  [imageName, gpsLon, gpsLat]
                ];

                fs.copyFile(imagePath, path.join(targetDir, imageName), () => {
                  imagescopied.value = imagescopied.value + 1;
                  resolve(0);
                });
              }
            }

            resolve(0);
          } catch (e) {
            resolve(1);
          }
        });
      } catch (e) {
        resolve(1);
      }
    });

    const exitnow = () => {
      ipcRenderer.send('exit-now');
    }

    return {
      systeminfo1, systeminfo2, systeminfo3, getBaseName,
      running, imagescameacross, imagescopied, 
      outputfolder, geojsonsfolder, totalgjs, buffer,
      selectoutfolder, selectgeojsonsfolder,
      sourcefolders, addsourcefolder, removefolder,
      statusmsg, startrunning, exitnow
    }
  },
})
</script>