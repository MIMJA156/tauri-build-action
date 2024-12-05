import * as fs from "fs";
import { Asset, TauriProject } from "./data";

export function delay(ms: number) {
    return new Promise(res => {
        setTimeout(res, ms);
    })
}

export function findCurrentAssets(platform: string, arch: string, tauri: TauriProject, project_path: string): Asset[] {
    let assetPaths = [];
    let altArch: string;

    switch (platform) {
        case "macos":
            if (arch === "intel") {
                let macPath = project_path + "/src-tauri/target/x86_64-apple-darwin/release/bundle/macos/";

                fs.renameSync(macPath + `${tauri.package.productName}.app.tar.gz`, macPath + `${tauri.package.productName}_${tauri.package.version}_x86_64.app.tar.gz`);
                assetPaths.push(macPath + `${tauri.package.productName}_${tauri.package.version}_x86_64.app.tar.gz`);

                fs.renameSync(macPath + `${tauri.package.productName}.app.tar.gz.sig`, macPath + `${tauri.package.productName}_${tauri.package.version}_x86_64.app.tar.gz.sig`);
                assetPaths.push(macPath + `${tauri.package.productName}_${tauri.package.version}_x86_64.app.tar.gz.sig`);

                altArch = "darwin-x86_64";
            } else if (arch === "silicon") {
                let macPath = project_path + "/src-tauri/target/aarch64-apple-darwin/release/bundle/macos/";

                fs.renameSync(macPath + `${tauri.package.productName}.app.tar.gz`, macPath + `${tauri.package.productName}_${tauri.package.version}_aarch64.app.tar.gz`);
                assetPaths.push(macPath + `${tauri.package.productName}_${tauri.package.version}_aarch64.app.tar.gz`);

                fs.renameSync(macPath + `${tauri.package.productName}.app.tar.gz.sig`, macPath + `${tauri.package.productName}_${tauri.package.version}_aarch64.app.tar.gz.sig`);
                assetPaths.push(macPath + `${tauri.package.productName}_${tauri.package.version}_aarch64.app.tar.gz.sig`);

                altArch = "darwin-aarch64";
            }
            break;

        case "windows":
            const winPath = project_path + "/src-tauri/target/release/bundle/nsis/";
            assetPaths.push(winPath + `${tauri.package.productName}_${tauri.package.version}_${process.arch}-setup.exe`);
            assetPaths.push(winPath + `${tauri.package.productName}_${tauri.package.version}_${process.arch}-setup.exe.sig`);

            altArch = "windows-x86_64";
            break;
    }

    const validAssets = assetPaths.filter((item) => fs.existsSync(item));
    return validAssets.map((item) => {
        return { path: item, architecture: altArch };
    });
}