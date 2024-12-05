import { getInput, setFailed, setOutput, info } from "@actions/core";
import { getRelease } from "./get";
import { execa } from "execa";

import { LocalProject, TauriProject } from "./data";
import { createRelease } from "./create";
import { readFileSync } from "fs";
import { resolve } from "path";
import { generateVersionJSON, uploadAssets } from "./upload";
import { delay, findCurrentAssets } from "./misc";

const archMap = {
    silicon: "aarch64-apple-darwin",
    intel: "x86_64-apple-darwin",
    universal: "universal-apple-darwin",
};

const baseCommand = "npm";
const baseArgs = ["run", "tauri", "build"];

async function run(): Promise<void> {
    try {
        if (process.env.GITHUB_TOKEN === undefined) throw new Error("GITHUB_TOKEN env var is required");

        const projectPath = resolve(process.cwd(), getInput("projectPath") || "./");

        const configPath = projectPath + "/src-tauri/tauri.conf.json";
        const jsonFile = JSON.parse(readFileSync(configPath).toString("utf-8"));
        const tauri = new TauriProject(jsonFile);

        const architecture = getInput("arch").toLowerCase() as "intel" | "silicon" | "none";
        const releaseTag = getInput("release-tag");
        const releaseName = getInput("release-name");
        const releaseBody = getInput("release-body");

        const local = new LocalProject(releaseTag, releaseName, releaseBody, tauri);

        if (architecture !== "none") {
            const current_args = [...baseArgs];

            current_args.push("--");
            current_args.push("--target");
            current_args.push(archMap[architecture]);

            if (architecture === "intel") {
                await execa(
                    "rustup",
                    ["target", "add", "x86_64-apple-darwin"],
                    {
                        stdio: "inherit",
                        env: { FORCE_COLOR: "0" },
                    },
                ).then();
            } else if(architecture === "silicon") {
                await execa(
                    "rustup",
                    ["target", "add", "aarch64-apple-darwin"],
                    {
                        stdio: "inherit",
                        env: { FORCE_COLOR: "0" },
                    },
                ).then();
            }

            await execa(baseCommand, current_args, {
                stdio: "inherit",
                env: { FORCE_COLOR: "0" },
            }).then();
        } else {
            const current_args = [...baseArgs];
            await execa(baseCommand, current_args, {
                stdio: "inherit",
                env: { FORCE_COLOR: "0" },
            }).then();
        }

        await delay(Math.random() * 10 * 1000);

        let release = await getRelease(local.releaseTag);
        
        try {
            if (release === null) release = await createRelease(local);
        } catch(e) {
            release = await getRelease(local.releaseTag);
        }

        let platform = process.platform === "win32" ? "windows" : process.platform === "darwin" ? "macos" : "linux";
        let assets = findCurrentAssets(platform, architecture, tauri, projectPath);

        if (tauri.updater.active) {
            const manifestPath = await generateVersionJSON(release!.id, projectPath, tauri, local, assets);
            assets.push({ path: manifestPath, architecture: "NONE/MANIFEST" });
        }

        await uploadAssets(release!.id, assets);
    } catch (error) {
        let err = error as Error;
        setFailed(err.message);
    }
}

run();