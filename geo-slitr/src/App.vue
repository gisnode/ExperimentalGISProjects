<template>
  <div id="approot">
    <div class="movable">
      <svg xmlns="http://www.w3.org/2000/svg" height="48" width="48"><path d="m24 44-8.15-8.15 2.2-2.2 4.45 4.45v-9.45h3v9.45l4.45-4.45 2.2 2.2ZM11.9 31.9 4 24l7.95-7.95 2.2 2.2L9.9 22.5h9.45v3H9.9l4.2 4.2Zm24.2 0-2.2-2.2 4.2-4.2h-9.4v-3h9.4l-4.2-4.2 2.2-2.2L44 24ZM22.5 19.3V9.9l-4.2 4.2-2.2-2.2L24 4l7.9 7.9-2.2 2.2-4.2-4.2v9.4Z"/></svg>
    </div>
    <div class="title">GEO SLITR</div>
    <br>

    <table style="margin:auto;">
      <tr>
        <td>
          <div class="systeminfo">
            <div>Hostname: {{ systeminfo1 }}</div>
            <div>User: {{ systeminfo2 }}</div>
            <div>Machine: {{ systeminfo3 }}</div>
          </div>
        </td>
        <td>
          <button class="outfolderbtn" v-on:click="selectoutfolder" v-bind:disabled="running">Output Folder</button>
          <br>
          <span class="secondarymsg" v-bind:title="outputfolder">
            {{ getBaseName(outputfolder).length > 20 ? getBaseName(outputfolder).substring(0, 20) + '...' : getBaseName(outputfolder) }}
          </span>
          <br>
        </td>
        <td>
          <input type="checkbox" v-model="geocopy" class="geocopycheck" v-bind:disabled="running">
          <label class="geocopylabel">GeoCopy</label>
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

    <table style="margin:auto;" v-if="geocopy">
      <tr>
        <td>
          <button class="gjsfldrbtn" v-on:click="selectgeojsonsfolder" v-bind:disabled="running">GeoJSONs Folder ({{ totalgjs }})</button>
          <br>
          <span class="secondarymsg" v-bind:title="geojsonsfolder">
            {{ getBaseName(geojsonsfolder).length > 20 ? getBaseName(geojsonsfolder).substring(0, 20) + '...' : getBaseName(geojsonsfolder) }}
          </span>
        </td>
        <td>
          <span class="primarymsg">Buffer (m): </span>
          <span><input type="number" v-model="buffer" style="width: 60px;" v-bind:disabled="running" min="0" max="1000"></span>
        </td>
      </tr>
    </table>
    <br>

    <table style="margin:auto;">
      <tr>
        <td><div class="secondarymsg">Photos Came Across: {{ imagescameacross }}</div></td>
        <td><div class="secondarymsg">Started: {{ startedtimestring }}</div></td>
      </tr>
      <tr>
        <td><div class="secondarymsg">Images Catalogued: {{ imagescatalogued }}</div></td>
        <td><div class="secondarymsg">Finished: {{ finishedtimestring }}</div></td>
      </tr>
      <tr>
        <td><div class="secondarymsg" v-show="geocopy">GeoPhotos Copied: {{ imagescopied }}</div></td>
        <td><div class="secondarymsg">Elapsed: {{ elapsedtimestring }}</div></td>
      </tr>
    </table><br>
    
    <div class="primarymsg">{{ statusmsg }}</div>
    <button class="startbtn" v-on:click="startrunning" v-bind:disabled="running">Start</button>
    
    <button class="xitbtn" v-on:click="tryingtoexit = true" id="xitbtn" v-show="running">Exit</button>
    <button class="xitbtn" v-on:click="exitnow" id="xitbtn" v-show="!running">Exit</button>

    <div class="confirmexit" v-show="tryingtoexit">
      <div class="confirmdialog">
        <div class="textcontent">
          <span>Are you Sure Want To Exit?</span><br><br>
          <button v-on:click="exitnow">YES</button>
          <button v-on:click="tryingtoexit = false">NO</button>
        </div>
      </div>
    </div>
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
import { stringify } from 'csv-stringify/sync';

import moment from 'moment';
import Database from 'better-sqlite3';

export default defineComponent({
  setup() {
    const systeminfo1 = ref('');
    const systeminfo2 = ref('');
    const systeminfo3 = ref('');

    onMounted(() => {
      systeminfo1.value = `${os.hostname()} `;
      systeminfo2.value = `${os.userInfo().username}`;
      systeminfo3.value = `${os.arch()} ${os.platform()} ${os.endianness()}`;
    });

    const sourcefolders: any = ref([
      // { id: '1', path: 'D:/TESTS/slitrtstmed/imgs' }
    ]);

    const running = ref(false);
    const geocopy = ref(false);

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

    // const outputfolder = ref('D:/TESTS/slitrtstmed/out');
    // const geojsonsfolder = ref('D:/TESTS/slitrtstmed/gjs');
    const outputfolder = ref('');
    const geojsonsfolder = ref('');

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
      if(geocopy.value){
        totalgjs.value = fs.readdirSync(gjpath).filter(entry => {
          return path.extname(entry).toLowerCase() == '.geojson'
        }).length;
      }
    }

    const defaultMsg = 'Click on Start';
    const statusmsg = ref(defaultMsg);

    const imagescameacross = ref(0);
    const imagescopied = ref(0);
    const imagescatalogued = ref(0);

    const startedtimestring = ref('-');
    const finishedtimestring = ref('-');
    const elapsedtimestring = ref('-');

    const tryingtoexit = ref(false);

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

    let timerObj: any = {
      moment: {},
      interval: {}
    };
    const startElapsedCounter = () => {
      timerObj.moment = moment();

      timerObj.interval = setInterval(() => {
        elapsedtimestring.value = `${(moment().diff(timerObj.moment, 'minute')).toFixed(2).toString()} mins`;
      }, 1000);
    }

    const DBDateTimeString = ref('');
    const preRequisites = () => {
      let currentDateTimeSuffix = moment().format('YYYY-MM-DD@HH-mm-ss');

      let timedfolderout = path.join(outputfolder.value, currentDateTimeSuffix);
      fs.mkdirSync(timedfolderout, { recursive: true });
      outputfolder.value = timedfolderout;

      DBDateTimeString.value = currentDateTimeSuffix;
      const db = new Database(path.join(outputfolder.value, `Cameras-${DBDateTimeString.value}.db`));

      const createTable1 = `CREATE TABLE IF NOT EXISTS gnsscameras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        camera TEXT,
        lon REAL, lat REAL, alt REAL,
        path TEXT
      )`;

      const createTable2 = `CREATE TABLE IF NOT EXISTS rawcameras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        camera TEXT,
        parentfolder TEXT
      )`;

      const createTable3 = `CREATE TABLE IF NOT EXISTS sourcefolders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        folderpath TEXT
      )`;

      db.exec(createTable1);
      db.exec(createTable2);
      db.exec(createTable3);
    }

    let gjsObjArry: any = [];
    let gjsCSVInfo: any = {};
    let imagesCounter: any = {};
    const initialGJSetup = () => {
      gjsObjArry = [];
      gjsCSVInfo = {};
      imagesCounter = {};
      
      const gjs = fs.readdirSync(geojsonsfolder.value).filter(entry => {
        return path.extname(entry).toLowerCase() == '.geojson'
      });

      for(let i = 0; i < gjs.length; i++){
        let gjName = path.parse(gjs[i]).name;

        gjsCSVInfo[gjName] = [];
        imagesCounter[gjName] = 1;

        let gjDir = path.join(outputfolder.value, gjName);
        // console.log(gjDir);

        if (!fs.existsSync(gjDir)){
          fs.mkdirSync(gjDir);
        }

        fs.copyFileSync(path.join(geojsonsfolder.value, gjs[i]), path.join(outputfolder.value,`${gjName}.geojson`));

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

      if(geocopy.value && geojsonsfolder.value == ''){
        showTempMsg('Select GeoJSONs Folder', 2);
        return;
      }

      calcGeoJSONs(geojsonsfolder.value);

      if(geocopy.value && totalgjs.value == 0){
        showTempMsg('Empty GeoJSONs Folder', 2);
        return;
      }

      preRequisites();
      
      if(geocopy.value) initialGJSetup();

      // console.log(gjsObjArry);

      imagescameacross.value = 0;
      imagescatalogued.value = 0;
      imagescopied.value = 0;

      running.value = true;
      statusmsg.value = 'Running';

      startElapsedCounter();
      checkNStartSliting();
    }
    
    const checkNStartSliting = async () => {
      startedtimestring.value = moment().format('YYYY-MM-DD@HH-mm-ss');

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

          await checkNDoTwoJobs(imagePath);
          imagescameacross.value = imagescameacross.value + 1;
        }
      }

      for (let i = 0; i < gjsObjArry.length; i++){
        let gjName = gjsObjArry[i]['name'];
        // console.log(gjsCSVInfo[gjName]);

        let csvContent = gjsCSVInfo[gjName];
        csvContent.unshift(['image', 'lon', 'lat']);

        try {
          fs.writeFileSync(path.join(outputfolder.value, `${gjName}-cameras.csv`), stringify(csvContent));
        } catch (e) {}
      }

      recordSourceFoldersInDB();

      finishedtimestring.value = moment().format('YYYY-MM-DD@HH-mm-ss');

      let timeDataString = `Started At ${startedtimestring.value}\r\nCompleted At ${finishedtimestring.value}\r\nTime Elapsed: ${elapsedtimestring.value}`;
      fs.writeFileSync(path.join(outputfolder.value, `Completed At ${finishedtimestring.value}.txt`), timeDataString);

      outputfolder.value = path.dirname(outputfolder.value);

      statusmsg.value = 'Completed';
      running.value = false;

      clearInterval(timerObj.interval);
    }

    const checkNDoTwoJobs = (imagePath: any) => new Promise(resolve => {
      try {
        let cmdCLI = `"${execPath.value}" -K Exif.GPSInfo.GPSLongitude -K Exif.GPSInfo.GPSLatitude -K Exif.GPSInfo.GPSAltitude`;
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
            const gpsAltParts = gnssInfoParts[2].trim().split('/');
            let gpsAlt = parseInt(gpsAltParts[0]) / parseInt(gpsAltParts[1]);
            // console.log(gpsAltParts);
            
            if(isNaN(gpsLon) || isNaN(gpsLat) || isNaN(gpsAlt)) {
              insertRawCamera(imagePath);
              resolve(1);
            }

            // console.log(path.basename(imagePath), gpsLon, gpsLat, gpsAlt, imagePath);

            // Catalogue GeoPhotos Into Database
            const db = new Database(path.join(outputfolder.value, `Cameras-${DBDateTimeString.value}.db`));
            db.prepare('INSERT INTO gnsscameras (camera, lon, lat, alt, path) VALUES (?, ?, ?, ?, ?)')
            .run(path.basename(imagePath), gpsLon, gpsLat, gpsAlt, imagePath).lastInsertRowid;

            imagescatalogued.value = imagescatalogued.value + 1;

            // Copy Geotagged Photos To Respective GeoJSON Folders
            if(geocopy.value){
              const ptFeat = turf.point([gpsLon, gpsLat]);
  
              for(let i = 0; i < gjsObjArry.length; i++){
                const featbuff = gjsObjArry[i]['featbuff'];
                if(turf.booleanWithin(ptFeat, featbuff)){
                  let gjName = gjsObjArry[i]['name'];
                  let targetDir = gjsObjArry[i]['dir'];
                  // let imageName = path.basename(imagePath);
  
                  let imageName = `PROC${String(imagesCounter[gjName]).padStart(4, '0')}.JPG`;

                  gjsCSVInfo[gjName] = [
                    ...gjsCSVInfo[gjName],
                    [imageName, gpsLon, gpsLat]
                  ];
                  // console.log(imagePath, targetDir, imageName);

                  fs.copyFile(imagePath, path.join(targetDir, imageName), () => {
                    imagesCounter[gjName] = imagesCounter[gjName] + 1;
                    imagescopied.value = imagescopied.value + 1;
                    resolve(0);
                  });
                } else {
                  resolve(0);
                }
              }
            } else {
              resolve(0);
            }
          } catch (e) {
            insertRawCamera(imagePath);
            resolve(1);
          }
        });
      } catch (e) {
        insertRawCamera(imagePath);
        resolve(1);
      }
    });

    const insertRawCamera = (imagePath: any) => {
      const db = new Database(path.join(outputfolder.value, `Cameras-${DBDateTimeString.value}.db`));
      db.prepare('INSERT INTO rawcameras (camera, parentfolder) VALUES (?, ?)')
      .run(path.basename(imagePath), path.dirname(imagePath)).lastInsertRowid;
    }

    const recordSourceFoldersInDB = () => {
      const db = new Database(path.join(outputfolder.value, `Cameras-${DBDateTimeString.value}.db`));

      for(let i = 0; i < sourcefolders.value.length; i++){
        db.prepare('INSERT INTO sourcefolders (folderpath) VALUES (?)')
        .run(sourcefolders.value[i].path).lastInsertRowid;
      }
    }

    const exitnow = () => {
      ipcRenderer.send('exit-now');
    }

    return {
      systeminfo1, systeminfo2, systeminfo3, getBaseName,
      running, geocopy, imagescameacross, imagescopied, 
      imagescatalogued, startedtimestring, finishedtimestring, elapsedtimestring, 
      outputfolder, geojsonsfolder, totalgjs, buffer,
      selectoutfolder, selectgeojsonsfolder,
      sourcefolders, addsourcefolder, removefolder,
      statusmsg, startrunning, exitnow, tryingtoexit
    }
  },
})
</script>