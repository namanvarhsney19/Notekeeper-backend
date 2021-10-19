const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
var fetchuser = require('../middleware/fetchuser');
const { body, validationResult } = require('express-validator');


// ROUTE 1 : Get all the Notes using : GET "/api/notes/fetchallnotes". Login required

router.get('/fetchallnotes', fetchuser, async (req, res) => {
    const note = await Note.find({ user: req.user.id });
    res.json(note);
})


// ROUTE 2 : Add a new Note using : POST "/api/notes/addnote". Login required

router.post('/addnote', fetchuser, [
    body('title', 'Enter a valid title').isLength({ min: 3 }),
    body('description', 'Description must be atleast 10 characters.').isLength({ min: 10 }),],
    async (req, res) => {
        try {

            const { title, description, tag } = req.body;

            // if there are errors return the bad request and corresponding errors.
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // Create a new Note object
            const note = new Note({
                title, description, tag, user: req.user.id
            })
            const savedNote = await note.save();
            res.json(savedNote);
        }
        catch (error) {
            console.log(error.message);
            res.status(500).send("Internal Server Error");
        }
    })


// ROUTE 3 : Update an existing Note using : PUT "/api/notes/updatenote". Login required

router.put('/updatenote/:id', fetchuser, async (req, res) => {
    try {
        const { title, description, tag } = req.body;

        // if there are errors return the bad request and corresponding errors.
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Create a newNote object
        const newNote = {}
        if (title) { newNote.title = title };
        if (description) { newNote.description = description };
        if (tag) { newNote.tag = tag };

        // Find the note to be updated --> update it
        let note = await Note.findById(req.params.id);
        if (!note) { return res.status(404).send("Not Found !"); }

        // If a different user id is passed
        if (note.user.toString() !== req.user.id) {
            return res.status(401).send("Not Allowed !");
        }

        note = await Note.findByIdAndUpdate(req.params.id, { $set: newNote }, { new: true });
        res.json(note);
    }
    catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
})


// ROUTE 4 : Delete a existing Note using : DELETE "/api/notes/deletenote". Login required

router.delete('/deletenote/:id', fetchuser, async (req, res) => {
    try {
        // if there are errors return the bad request and corresponding errors.
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        // Find the note to be updated --> update it
        let note = await Note.findById(req.params.id);
        if (!note) { return res.status(404).send("Not Found !"); }

        // If a different user id is passed / Allow user if only he owns this Note
        if (note.user.toString() !== req.user.id) {
            return res.status(401).send("Not Allowed !");
        }

        note = await Note.findByIdAndDelete(req.params.id);
        res.json({ "Status": "Note deleted successfully" });
    }
    catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
})

module.exports = router;