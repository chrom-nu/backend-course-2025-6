import { Command } from "commander"
import fs from "fs"
import superagent from "superagent"
import http from "http"

const program = new Command()

program
  .requiredOption("-h, --host <host>", "Address to the server (required)")
  .requiredOption("-p, --port <port>", "Port number to connect to (required)")
  .requiredOption("-c, --cache <cache>", "Path to the directory with cached files");

program.parse(process.argv);
const options = program.opts();

const cacheFolder = options.cache

try {
    await fs.promises.access(cacheFolder);
} catch {
    console.log(`Creating folder ${cacheFolder}`)
    fs.promises.mkdir(cacheFolder)
}

const server = http.createServer(async (req, res) => {
    res.writeHead(200, {"Content-Type": "text/plain"})
    res.end("Server is succesfully works")
})

server.listen(parseInt(options.port), options.host)