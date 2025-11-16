import { Command } from "commander"
import fs from "fs"
import express from "express"
import path from "path"
import multer from "multer";

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";


const upload = multer({ dest: "uploads/" });
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
    await fs.promises.mkdir(cacheFolder)
}


let app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static("public"))

const allowedMethods = {
    "/search": ["POST"],
    "/inventory": ["GET", "POST", "PUT", "DELETE"],
};

app.use((req, res, next) => {
    const allowed = allowedMethods[req.path];
    if (allowed && !allowed.includes(req.method)) {
        return res.sendStatus(405);
    }
    next();
});

let data = {}
let id = 0;




/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new inventory item
 *     description: Uploads a new inventory item with optional photo.
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: inventory_name
 *         description: Name of the item
 *         required: true
 *         type: string
 *       - in: formData
 *         name: description
 *         description: Description of the item
 *         required: false
 *         type: string
 *       - in: formData
 *         name: photo
 *         description: Image file
 *         required: false
 *         type: file
 *     responses:
 *       201:
 *         description: Item successfully created
 *       400:
 *         description: Bad request — name missing
 *       405:
 *         description: Method not allowed
 */
app.post("/register", upload.single("photo"), (req, res) => {
    
    if(req.body.inventory_name == "")
        res.sendStatus(400)
    else {

        data[id] = {
            "name": req.body.inventory_name, 
            "description": req.body.description,
            "file":        req.file || null 
        }

        id += 1
        console.log(data)
        res.sendStatus(201)
    }
});

app.all("/register", (req, res) => {
    res.setHeader("Allow", "POST");
    res.sendStatus(405);
});


/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Get full list of inventory items
 *     responses:
 *       200:
 *         description: List of all items
 *       405:
 *         description: Method not allowed
 */
app.get("/inventory", (req, res) => {
    res.json(data)
})

app.all("/inventory", (req, res) => {
    res.setHeader("Allow", ["GET", "POST"]);
    res.sendStatus(405);
});


/**
 * @swagger
 * /inventory/{id}:
 *   get:
 *     summary: Get item information by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Item ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item found
 *       404:
 *         description: Item not found
 *       405:
 *         description: Method not allowed
 */
app.get("/inventory/:id", (req, res) => {
    res.json(data[req.params.id])
})


/**
 * @swagger
 * /inventory/{id}:
 *   put:
 *     summary: Update name or description of an item
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inventory_name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated successfully
 *       404:
 *         description: Item not found
 *       405:
 *         description: Method not allowed
 */
app.put("/inventory/:id", (req, res) => {
    
    const item = data[req.params.id];
    if (!item) return res.sendStatus(404);

    const sentData = req.body;
    if(sentData.inventory_name)
        item.name = sentData.inventory_name

    if(sentData.description)
        item.description = sentData.description

    res.sendStatus(200)
})




/**
 * @swagger
 * /inventory/{id}:
 *   delete:
 *     summary: Delete item by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: Item not found
 *       405:
 *         description: Method not allowed
 */
app.delete("/inventory/:id", (req, res) => {
    const id = req.params.id
    
    if(data[id])
    {
        delete data[id]
        res.sendStatus(200)
    }
    else
        res.sendStatus(404)
})

app.all("/inventory/:id", (req, res) => {
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    res.sendStatus(405);
});


/**
 * @swagger
 * /inventory/{id}/photo:
 *   get:
 *     summary: Get photo of item
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Returns item photo
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Item or photo not found
 *       405:
 *         description: Method not allowed
 */
app.get("/inventory/:id/photo", (req, res) => {
    const item = data[req.params.id];
    if (!item || !item.file) {
        return res.sendStatus(404); 
    }

    res.setHeader("Content-Type", "image/jpeg"); 
    res.sendFile(path.resolve(item.file.path));
})



/**
 * @swagger
 * /inventory/{id}/photo:
 *   put:
 *     summary: Upload or replace item photo
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Item ID
 *         schema:
 *           type: integer
 *       - in: formData
 *         name: photo
 *         required: true
 *         type: file
 *     responses:
 *       200:
 *         description: Photo updated
 *       404:
 *         description: Item not found
 *       405:
 *         description: Method not allowed
 */

app.put("/inventory/:id/photo", upload.single("photo"), (req, res) => {
    const item = data[req.params.id];
    if (!item) return res.sendStatus(404);

    const sentData = req.body
    if(sentData.file)
        item.file = sentData.file
    else
        item.file = null
    res.sendStatus(200)
})

app.all("/inventory/:id/photo", (req, res) => {
    res.setHeader("Allow", ["GET", "PUT"]);
    res.sendStatus(405);
});





app.get("/RegisterForm.html", express.static("RegisterForm"))
app.get("/SearchForm.html", express.static("SearchForm"))



/**
 * @swagger
 * /search:
 *   post:
 *     summary: Search item by ID from HTML form
 *     consumes:
 *       - application/x-www-form-urlencoded
 *     parameters:
 *       - in: formData
 *         name: id
 *         description: ID to search
 *         required: true
 *         type: string
 *       - in: formData
 *         name: includePhoto
 *         description: Whether to include photo
 *         type: string
 *     responses:
 *       200:
 *         description: HTML description returned
 *       404:
 *         description: Not found
 *       405:
 *         description: Method not allowed
 */
app.post("/search", (req, res) => {
    const id = req.body.id;
    const item = data[id];

    if (!item) return res.sendStatus(404);

    let html = `<p>Inventory name: ${item.name}</p>
                <p>Description: ${item.description}</p>`;

    if (req.body.includePhoto == "on" && item.file) {
        html += `<img src="/inventory/${id}/photo" alt="Photo">`;
    }

    res.send(html);
})

app.all("/search", (req, res) => {
    res.setHeader("Allow", ["POST"]);
    res.sendStatus(405);
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(parseInt(options.port), options.host)
