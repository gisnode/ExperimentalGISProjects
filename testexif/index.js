const fs = require('fs');
const path = require('path');

const { parse } = require('csv-parse/sync');
const piexifjs = require('piexifjs');

console.log(2);

// let folderpath = 'G:/exifrtest/imgs';
// let csvpath = 'G:/exifrtest/imgs/geo.csv';

// const degToDmsRational = (degFloat) => {
//     let secDigits = 5;

//     let degAbs = Math.abs(degFloat);
//     let minFloat = degAbs % 1 * 60;
//     let secFloat = minFloat % 1 * 60;
//     let deg = Math.floor(degAbs);
//     let min = Math.floor(minFloat);
//     let sec = Math.round(secFloat * 10 ** secDigits);

//     return [[deg, 1], [min, 1], [sec, 10 ** secDigits]];
// }

// const csvcontent = fs.readFileSync(csvpath, 'utf-8');
// // console.log(csvcontent);

// const records = parse(csvcontent, { delimiter: ",", columns: true });
// // console.log(records);

// let mappedObjects = {};
// for (let i = 0; i < records.length; i++){
//     let image = records[i]['image'];
//     let lat = records[i]['lat'];
//     let lon = records[i]['lon'];
//     let alt = records[i]['alt'];

//     let gpsObj = {
//         '0': [ 2, 3, 0, 0 ],
//         '1': 'N',
//         '2': degToDmsRational(lat),
//         '3': 'E',
//         '4': degToDmsRational(lon),
//         '5': 0,
//         '6': [ alt * 100, 100 ],
//         '9': 'V',
//         '18': 'WGS-84',
//         '30': 0
//     }

//     mappedObjects[image] = gpsObj;
// }

// // console.log(mappedObjects);

// const files = fs.readdirSync(folderpath);
// const jpgimgs = files.filter(img => {
//     return path.extname(img).toLowerCase() == '.jpg' || path.extname(img).toLowerCase() == '.jpeg'
// });
// // console.log(jpgimgs);

// for (let i = 0; i < jpgimgs.length; i++){
//     let imgRawData = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(folderpath, jpgimgs[i]), 'base64');

//     let exifObjRaw = piexifjs.load(imgRawData);

//     let gpsInfo = mappedObjects[jpgimgs[i]];

//     exifObjRaw['GPS'] = gpsInfo;

//     let exifbytes = piexifjs.dump(exifObjRaw)
//     let newJpeg = piexifjs.insert(exifbytes, imgRawData)
//     // console.log(newJpeg.substring(0, 100));

//     let imgNewGeo = path.join(folderpath, 'out', 'exif_' + jpgimgs[i]);

//     let data = newJpeg.replace(/^data:image\/\w+;base64,/, "");
//     let buf = Buffer.from(data, 'base64');
//     fs.writeFileSync(imgNewGeo, buf)
// }