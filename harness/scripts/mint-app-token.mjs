import crypto from "node:crypto";
import fs from "node:fs";

const required = ["GITHUB_APP_ID", "GH_PRIVATE_APP_KEY", "GITHUB_REPOSITORY"];
for (const name of required) if (!process.env[name]) throw new Error(`${name} is required`);
const privateKey = process.env.GH_PRIVATE_APP_KEY;

const b64url = (value) => Buffer.from(typeof value === "string" ? value : JSON.stringify(value)).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const unsigned = `${b64url({ alg: "RS256", typ: "JWT" })}.${b64url({ iat: now - 60, exp: now + 540, iss: process.env.GITHUB_APP_ID })}`;
const jwt = `${unsigned}.${crypto.sign("RSA-SHA256", Buffer.from(unsigned), privateKey.replaceAll("\\n", "\n")).toString("base64url")}`;
const appHeaders = { authorization: `Bearer ${jwt}`, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28" };
const installationResponse = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/installation`, { headers: appHeaders });
if (!installationResponse.ok) throw new Error(`GitHub App installation lookup failed: ${installationResponse.status}`);
const installationId = (await installationResponse.json()).id;
const [owner, repository] = process.env.GITHUB_REPOSITORY.split("/");
const tokenResponse = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, { method: "POST", headers: { ...appHeaders, "content-type": "application/json" }, body: JSON.stringify({ repositories: [repository], permissions: { contents: "write", issues: "write", pull_requests: "write" } }) });
if (!tokenResponse.ok) throw new Error(`GitHub App token mint failed: ${tokenResponse.status} ${await tokenResponse.text()}`);
const token = (await tokenResponse.json()).token;
console.log(`::add-mask::${token}`);
if (!process.env.GITHUB_OUTPUT) throw new Error("GITHUB_OUTPUT is required");
const delimiter = `token_${crypto.randomUUID()}`;
fs.appendFileSync(process.env.GITHUB_OUTPUT, `token<<${delimiter}\n${token}\n${delimiter}\n`);
