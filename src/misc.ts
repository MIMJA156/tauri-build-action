import * as fs from 'fs';
import * as path from 'path';
import { Artifact, TauriProject } from './data';

export function printDirectoryTree(dirPath: string, indent: string = '', maxDepth: number = Infinity, currentDepth: number = 0): void {
    if (currentDepth > maxDepth) {
        return;
    }

    const files: string[] = fs.readdirSync(dirPath);

    files.forEach(file => {
        const filePath: string = path.join(dirPath, file);
        const stats: fs.Stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            console.log(indent + '|-- ' + file + ' (Dir)');
            printDirectoryTree(filePath, indent + '   ', maxDepth, currentDepth + 1);
        } else {
            console.log(indent + '|-- ' + file);
        }
    });
}

export function findCurrentArtifacts(platform: string, arch: string, tauri: TauriProject, project_path: string): Artifact[] {
    let assetPaths = [];

    switch (platform) {
        case "macos":
            const macPath = project_path + "/src-tauri/target/release/bundle/macos/";
            assetPaths.push(macPath + `${tauri.package.productName}.app.tar.gz`);
            assetPaths.push(macPath + `${tauri.package.productName}.app.tar.gz.sig`);
            break;

        case "windows":
            const winPath = project_path + "\\src-tauri\\target\\release\\bundle\\nsis\\";
            assetPaths.push(winPath + `${tauri.package.productName}_${tauri.package.version}_${process.arch}-setup.exe`);
            assetPaths.push(winPath + `${tauri.package.productName}_${tauri.package.version}_${process.arch}-setup.nsis.zip`);
            assetPaths.push(winPath + `${tauri.package.productName}_${tauri.package.version}_${process.arch}-setup.nsis.zip.sig`);
            break;
    }

    const validAssets = assetPaths.filter(item => fs.existsSync(item))
    return validAssets.map(item => {
        return { path: item, arch: process.arch }
    });
}