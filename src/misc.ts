import * as fs from "fs";
import * as path from "path";
import { Asset, TauriProject } from "./data";
import { execa } from "execa";

export function printDirectoryTree(dirPath: string, indent: string = "", maxDepth: number = Infinity, currentDepth: number = 0): void {
    if (currentDepth > maxDepth) {
        return;
    }

    const files: string[] = fs.readdirSync(dirPath);

    files.forEach((file) => {
        const filePath: string = path.join(dirPath, file);
        const stats: fs.Stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            console.log(indent + "|-- " + file + " (Dir)");
            printDirectoryTree(filePath, indent + "   ", maxDepth, currentDepth + 1);
        } else {
            console.log(indent + "|-- " + file);
        }
    });
}

export function findCurrentAssets(platform: string, arch: string, tauri: TauriProject, project_path: string): Asset[] {
    let assetPaths = [];

    switch (platform) {
        case "macos":
            let macPath;

            if (arch === "intel") {
                macPath = project_path + "/src-tauri/target/x86_64-apple-darwin/release/bundle/macos/";
            } else if (arch === "silicon") {
                macPath = project_path + "/src-tauri/target/aarch64-apple-darwin/release/bundle/macos/";
            }

            if (macPath) {
                assetPaths.push(macPath + `${tauri.package.productName}.app`);
                assetPaths.push(macPath + `${tauri.package.productName}.app.tar.gz`);
                assetPaths.push(macPath + `${tauri.package.productName}.app.tar.gz.sig`);
            }
            break;

        case "windows":
            const winPath = project_path + "/src-tauri/target/release/bundle/nsis/";
            assetPaths.push(winPath + `${tauri.package.productName}_${tauri.package.version}_${process.arch}-setup.exe`);
            assetPaths.push(winPath + `${tauri.package.productName}_${tauri.package.version}_${process.arch}-setup.nsis.zip`);
            assetPaths.push(winPath + `${tauri.package.productName}_${tauri.package.version}_${process.arch}-setup.nsis.zip.sig`);
            break;
    }

    console.log(assetPaths);
    console.log(platform);
    console.log(process.platform);

    const validAssets = assetPaths.filter((item) => fs.existsSync(item));
    return validAssets.map((item) => {
        return { path: item, arch: process.arch };
    });
}

// edits assets array by reference
export async function compressMacAssets(assets: Asset[]) {
    for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];

        if (asset.path.endsWith(".app") && !fs.existsSync(asset.path + ".tar.gz")) {
            await execa("tar", ["czf", `${asset.path}.tar.gz`, "-C", path.dirname(asset.path), path.basename(asset.path)], {
                stdio: "inherit",
                env: { FORCE_COLOR: "0" },
            }).then();

            assets.push({ arch: asset.arch, path: asset.path + ".tar.gz" });
        }
    }
}
