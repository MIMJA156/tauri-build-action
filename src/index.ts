import { getInput, setFailed } from "@actions/core"
import { getOctokit } from "@actions/github"
import { execa } from "execa"

const arch_map = {
    "silicon": "aarch64-apple-darwin",
    "intel": "x86_64-apple-darwin",
    "universal": "universal-apple-darwin"
}

const base_command = "npm"
const base_args = ["run", "tauri", "build"]

async function run(): Promise<void> {
    try {

        if (process.env.GITHUB_TOKEN === undefined) {
            throw new Error('GITHUB_TOKEN is required');
        }

        const architecture = getInput("arch").toLowerCase() as "intel" | "silicon" | "none"
        if (architecture !== "none") {
            const current_args = [...base_args];

            current_args.push("--");
            current_args.push("--target");
            current_args.push(arch_map[architecture]);

            await execa(base_command, current_args);
        } else {
            const current_args = [...base_args];
            await execa(base_command, current_args);
        }

    } catch (error) {
        let err = error as Error
        setFailed(err.message);
    }
}

run();