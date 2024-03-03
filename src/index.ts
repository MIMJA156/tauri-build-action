import { getInput, setFailed } from "@actions/core"
import { get_release } from './get'
import { execa } from "execa"

import { LocalProject, TauriProject } from './data'
import { create_release } from './create'
import { readFileSync } from 'fs';
import { resolve } from 'path'
import { printDirectoryTree } from "./misc"

const arch_map = {
    "silicon": "aarch64-apple-darwin",
    "intel": "x86_64-apple-darwin",
    "universal": "universal-apple-darwin"
}

const base_command = "npm"
const base_args = ["run", "tauri", "build"]

async function run(): Promise<void> {
    try {
        if (process.env.GITHUB_TOKEN === undefined) throw new Error('GITHUB_TOKEN env var is required');

        const project_path = resolve(process.cwd(), getInput('projectPath') || "./");

        const config_path = project_path + "/src-tauri/tauri.conf.json";
        const json_file = JSON.parse(readFileSync(config_path).toString("utf-8"));
        const tauri = new TauriProject(json_file);

        const architecture = getInput("arch").toLowerCase() as "intel" | "silicon" | "none"
        const release_tag = getInput("release-tag");
        const release_name = getInput("release-name");
        const release_body = getInput("release_body");

        const local = new LocalProject(release_tag, release_name, release_body, tauri);

        if (architecture !== "none") {
            const current_args = [...base_args];

            current_args.push("--");
            current_args.push("--target");
            current_args.push(arch_map[architecture]);

            await execa(base_command, current_args, {
                stdio: 'inherit',
                env: { FORCE_COLOR: '0' },
            }).then();
        } else {
            const current_args = [...base_args];
            await execa(base_command, current_args, {
                stdio: 'inherit',
                env: { FORCE_COLOR: '0' },
            }).then();
        }

        let release = await get_release(local.release_tag);
        if (release === null) release = await create_release(local);


    } catch (error) {
        let err = error as Error
        setFailed(err.message);
    }
}

run();