#!/usr/bin/env node

/**
 * Automated Secure Upstream Repo Setup Script (v0.6)
 *
 * This script helps students bring the private Code Platoon upstream repo
 * into the correct location so the dynamic day focus feature works.
 *
 * It follows GitHub best practices for handling private repositories:
 * - Recommends fine-grained Personal Access Tokens (PAT) with minimal scopes
 * - Recommends SSH keys for authentication
 * - Never stores credentials
 * - Warns about private vs public repo implications
 *
 * Usage:
 *   node scripts/setup-course.js          # Interactive mode
 *   node scripts/setup-course.js --auto   # Non-interactive with confirmation (for postinstall)
 *
 * Documentation links shown to the student:
 * - https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
 * - https://docs.github.com/en/authentication/connecting-to-github-with-ssh
 */

const readline = require("readline");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const TARGET_DIR = path.join(
  process.cwd(),
  "data",
  "course-content",
  "aico-echo",
);
const DEFAULT_UPSTREAM = "https://github.com/CodePlatoon/aico-echo.git";

function printSecurityGuidance() {
  console.log("\n=== Important Security Notice ===\n");
  console.log("The upstream repository is PRIVATE.");
  console.log("You must authenticate to clone it.");
  console.log("\nGitHub Best Practices for Private Repos:");
  console.log(
    "1. Use a fine-grained Personal Access Token (PAT) with the minimum required scopes (Contents: Read-only).",
  );
  console.log("2. Prefer SSH keys over HTTPS tokens when possible.");
  console.log("3. Never commit tokens or keys to any repository.");
  console.log("4. Rotate tokens regularly.\n");
  console.log("Official Documentation:");
  console.log(
    "  PATs: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token",
  );
  console.log(
    "  SSH:  https://docs.github.com/en/authentication/connecting-to-github-with-ssh\n",
  );
}

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function runInteractive() {
  printSecurityGuidance();

  const url =
    (await prompt(
      `Enter the upstream repo URL (default: ${DEFAULT_UPSTREAM}): `,
    )) || DEFAULT_UPSTREAM;

  if (fs.existsSync(TARGET_DIR)) {
    console.log(`\nTarget directory already exists: ${TARGET_DIR}`);
    const overwrite = await prompt(
      "Do you want to remove it and re-clone? (y/N): ",
    );
    if (overwrite.toLowerCase() === "y") {
      fs.rmSync(TARGET_DIR, { recursive: true, force: true });
    } else {
      console.log("Keeping existing directory. Setup complete.");
      return;
    }
  }

  console.log(`\nCloning ${url} into ${TARGET_DIR}...`);
  try {
    execSync(`git clone ${url} ${TARGET_DIR}`, { stdio: "inherit" });
    console.log("\n✅ Upstream repo cloned successfully!");
    console.log(
      "The app will now load full day focus content from the upstream materials.\n",
    );
  } catch (err) {
    console.error(
      "\n❌ Clone failed. Please check your authentication and try again.",
    );
    console.error(
      "You can run this script again anytime with: npm run setup-course\n",
    );
  }
}

async function runAuto() {
  if (fs.existsSync(TARGET_DIR)) {
    console.log("Upstream repo already present. Skipping setup.");
    return;
  }

  printSecurityGuidance();

  const answer = await prompt(
    "Would you like to clone the upstream repo now? (Y/n): ",
  );
  if (answer.toLowerCase() === "n") {
    console.log(
      "You can run `npm run setup-course` later to complete the setup.",
    );
    return;
  }

  const url = DEFAULT_UPSTREAM; // In a real version we could allow override, but keep simple for --auto
  console.log(`Cloning ${url}...`);

  try {
    execSync(`git clone ${url} ${TARGET_DIR}`, { stdio: "inherit" });
    console.log(
      "✅ Upstream repo ready. Full day focus feature is now active.",
    );
  } catch (err) {
    console.error("Clone failed. Run `npm run setup-course` manually later.");
  }
}

const isAuto = process.argv.includes("--auto");

if (isAuto) {
  runAuto().catch(console.error);
} else {
  runInteractive().catch(console.error);
}
