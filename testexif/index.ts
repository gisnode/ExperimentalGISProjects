import fs from 'fs';
import path from 'path';

import { parse } from 'csv-parse/sync';

let folderpath = 'G:/exifrtest/imgs';
let csvpath = 'G:/exifrtest/imgs/geo.csv';

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

const csvcontent = fs.readFileSync(csvpath, 'utf-8');
// console.log(csvcontent);

const records = parse(csvcontent, { delimiter: ",", columns: true });
// console.log(records);

let mappedObjects: any = {};
for (let i = 0; i < records.length; i++){
    let image = records[i]['image'];
    let lat = records[i]['lat'];
    let lon = records[i]['lon'];
    let alt = records[i]['alt'];

    let exifArray: any = [];
    exifArray.push('-M"set Exif.GPSInfo.GPSVersionID 2 3 0 0"');
    exifArray.push('-M"set Exif.GPSInfo.GPSLatitudeRef N"');
    exifArray.push(`-M"set Exif.GPSInfo.GPSLatitude ${degToDmsRational(lat)}"`);
    exifArray.push('-M"set Exif.GPSInfo.GPSLongitudeRef E"');
    exifArray.push(`-M"set Exif.GPSInfo.GPSLongitude ${degToDmsRational(lon)}"`);
    exifArray.push('-M"set Exif.GPSInfo.GPSAltitudeRef 0"');
    exifArray.push(`-M"set Exif.GPSInfo.GPSAltitude ${Math.round(alt * 100)}/100"`);
    exifArray.push('-M"set Exif.GPSInfo.GPSStatus V"');
    exifArray.push('-M"set Exif.GPSInfo.GPSMapDatum WGS-84"');
    exifArray.push('-M"set Exif.GPSInfo.GPSDifferential 0"');

    mappedObjects[image] = exifArray.join(' ');
}

// console.log(mappedObjects);

const files = fs.readdirSync(folderpath);
const jpgimgs = files.filter(img => {
    return path.extname(img).toLowerCase() == '.jpg' || path.extname(img).toLowerCase() == '.jpeg'
});
// console.log(jpgimgs);

for (let i = 0; i < jpgimgs.length; i++){
    console.log(jpgimgs[i]);
    console.log(mappedObjects[jpgimgs[i]]);
}