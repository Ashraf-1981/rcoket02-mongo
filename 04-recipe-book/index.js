const express = require('express');
require('dotenv').config();
const cors = require('cors'); // cors = cross origin resources sharing
const { connect } = require('./db')
const { ObjectId } = require('mongodb');

// 1. create express application
const app = express();

// 2. provide some settings
app.use(express.json()); // allows us to send json responses and recieve json requests
app.use(cors()); // enable CORS if it is a public API

async function main() {

    const db = await connect(process.env.MONGO_URI, "rocket02_recipe_book");

    app.get('/health', function (req, res) {
        res.send("Still alive");
    })

    app.get('/', function (req, res) {
        res.send("Ok")
    });

    // For RESTFUL API, there's a convention in naming the URLs
    // each endpoint is also sometimes known as a resource
    // in short, each URL is like a path to a file
    // we use query string to tell the endpoint what criteria the client wants
    // search by tags, cuisine, ingredients, name
    // for example ?tags=pasta&cuisine=italian
    app.get('/recipes', async function (req, res) {

        // instead of:
        // const tags = req.query.tags;
        // const cuisine = req.query.cuisines;
        // const ingredients = req.query.ingredients;
        // const name = req.query.name;
        // we can do array destructuring:

        // const { tags, cuisine, ingredients, name } = req.query;

        // new crud challenge. 
        const { tags, cuisine, ingredients, name, prepTimeMin, prepTimeMax, cookTimeMin, cookTimeMax, dish_type } = req.query;


        const critera = {}

        if (cuisine) {
            critera["cuisine.name"] = { $regex: cuisine, $options: 'i' }
        }


        // assume the tags a comma delimited string
        // example: quick,easy
        if (tags) {
            // "quick,easy".split(",") => ["quick", "easy"]
            // "quick|easy".split("|") => ["quick, "easy"]
            const tagsArray = tags.split(',');
            critera["tags.name"] = { $all: tagsArray }
        }

        if (name) {
            critera.name = { $regex: name, $options: 'i' };
        }

        if (ingredients) {
            //    let regexArray = [];
            //    for (let eachIngredient of ingredients.split(',')) {
            //     regexArray.push( new RegExp(eachIngredient, 'i'))
            //    }
            //    critera['ingredients.name'] = {
            //       $all: regexArray

            critera['ingredients.name'] = ingredients.split(',').map(function (eachIngredient) {
                return new RegExp(eachIngredient, "i")
            })
        }

        // Qn 1
        // added new
        // Number(prepTimeMin/Max) is what the user type
        if (prepTimeMin || prepTimeMax) {
            critera.prepTime = {};
            if (prepTimeMin) {
                critera.prepTime.$gt = Number(prepTimeMin);
            }
            if (prepTimeMax) {
                critera.prepTime.$lt = Number(prepTimeMax);
            }
        }

        // Qn 2
        // Number(cookTimeMin/Max) is what the user type
        if (cookTimeMin || cookTimeMax) {
            critera.cookTime = {};
            if (cookTimeMin) {
                critera.cookTime.$gt = Number(cookTimeMin);
            }
            if (cookTimeMax) {
                critera.cookTime.$lt = Number(cookTimeMax);
            }
        }

        // Qn 3a
        // add a new field dish_type
        if (dish_type) {
            critera.dish_type = dish_type;
        }

        const recipes = await db.collection("recipes").find(critera).toArray();
        res.json({
            "recipes": recipes
        })
    })

    // req.body should contain: name, cuisine, prepTime, cookTime, servings, ingredients, instructions, tags
    // ingredients must be an array of ingredient objects: [ {name, amount, unit}]
    // tags must be an array of strings
    app.post('/recipes', async function (req, res) {

        try {

            const { name, cuisine, ingredients, instructions, tags, cookTime, prepTime, servings, dish_type } = req.body
            if (!name || !cuisine || !ingredients || !instructions || !tags) {
                return res.status(400).json({
                    'error': 'Missing required fields'
                })
            }

            // check if the cuisine is valid
            const cuisineDoc = await db.collection('cuisines').findOne({
                name: { $regex: cuisine, $options: 'i' }
            })
            if (!cuisineDoc) {
                return res.status(400).json({
                    "error": "Invalid cuisine"
                })
            }

            // check if prep time must be than 0
            if (prepTime <= 0) {
                return res.status(400).json({
                    'error': 'Prep time cannot be less than 0'
                })
            }

            // check if cooktime is more than 0
            if (cookTime <= 0) {
                return res.status(400).json({
                    'error': 'Cook time cannot be less than 0'
                })
            }

            // servings must be more than 0
            if (servings <= 0) {
                return res.status(400).json({
                    'error': 'Servings must be more than 0'
                })
            }

            // make sure the given tags exist
            const tagDocs = await db.collection('tags').find({
                name: { $in: tags }
            }).toArray();
            if (tagDocs.length !== tags.length) {
                return res.status(400).json({
                    'error': "There are some invalid tags"
                })
            }

            const newRecipe = {
                name,
                cuisine: cuisineDoc,
                prepTime,
                cookTime,
                servings,
                ingredients,
                instructions,
                tags: tagDocs,
                // Qn 3b
                dish_type,
            }

            // insert into the database
            const result = await db.collection("recipes").insertOne(newRecipe);
            res.json({
                'message': 'Recipe inserted successfully',
                recipeId: result.insertedId
            })
        } catch (e) {
            console.error(e);
            return res.status(500).json({
                'error': "Unable to insert new record"
            })
        }

    })

    // Qn 4a
    // Create a new collection-courses
    // with keys -names and descriptions
    app.post('/courses', async function (req, res) {

        try {

            const { name, description } = req.body
            if (!name || !description) {
                return res.status(400).json({
                    'error': 'Missing required fields'
                })
            }

            const newCourse = {
                name,
                description,
                recipes: []
            }

            // insert into the new collection and database
            const result = await db.collection("courses").insertOne(newCourse);
            res.json({
                'message': 'Course inserted successfully',
                courseId: result.insertedId
            })
        }

        catch (e) {
            console.error(e);
            return res.status(500).json({
                'error': "Unable to insert new record"
            })
        }
    })

    // Qn 4b
    // Add a recipe to the courses but need to findOne from collections-recipes
    // Not editing/replacing just performing the action-add thats why do in post and not put
    // Here req.body means the body inside arc
    app.post('/courses/:id/recipes', async function (req, res) {

        try {

            const { recipeId } = req.body

            // Validation by ID
            if (!recipeId) {
                return res.status(400).json({
                    'error': 'Missing recipeId'
                })
            }

            // If the recipdId does exists, move on
            // Check if the recipe exists in recipes
            const recipe = await db.collection("recipes").findOne({
                _id: new ObjectId(recipeId)
            });

            if (!recipe) {
                return res.status(400).json({
                    'error': 'Recipe not found'
                })
            }

            // If the recipe does exists, updateOne in courses
            const result = await db.collection('courses').updateOne({
                // Which document and  What change?
                _id: new ObjectId(req.params.id)
            },
                {
                    $push:
                        // Push only the objectId(from recipes id) into courses-recipes []
                        // which refers to the original recipes collections
                        // Insert courseId into arc url and recipeId inside the body to update
                        { recipes: new ObjectId(recipeId) }
                }
            )

            // Check on the courses collections, check if the course exists
            if (result.matchedCount === 0) {
                return res.status(400).json({
                    'error': "Course not found"
                })
            }

            res.json ({
                'message' : 'Recipe added to course'
            })
        }

        catch (e) {
            console.error(e);
            return res.status(500).json({
                'error': "Unable to add recipe to course"
            })
        }
    })

    app.delete('/recipes/:id', async function (req, res) {
        try {
            const recipeId = req.params.id;
            const result = await db.collection('recipes').deleteOne({
                _id: new ObjectId(recipeId)
            });

            if (result.deletedCount === 0) {
                return res.status(404).json({
                    'error': 'Not found'
                })
            }

            res.json({
                'message': 'The recipe has been deleted'
            })

        } catch (e) {
            console.error(e);
            res.status(500).json({
                error: "Unable to delete"
            })
        }
    })

    // Qn 4c
    app.delete('/courses/:id/recipes/:recipeId', async function (req, res) {
        try {

            const result = await db.collection('courses').updateOne({
                // 1st argumet
                _id: new ObjectId(req.params.id)
            },
                // 2nd argument
            {
                 $pull : { recipes: new ObjectId(req.params.recipeId) }
            })

             if (result.matchedCountCount === 0) {
                return res.status(404).json({
                    'error': 'Course Not found'
                })
            }

            res.json ({
                'message': "Recipe remove from course"
            })
        }

            catch (e) {
            console.error(e);
            res.status(500).json({
                error: "Unable to remove recipe from course"
            })
        }
    })





    app.put('/recipes/:id', async function (req, res) {

        try {
            const { name, cuisine, ingredients, instructions, tags, cookTime, prepTime, servings, dish_type } = req.body
            if (!name || !cuisine || !ingredients || !instructions || !tags) {
                return res.status(400).json({
                    'error': 'Missing required fields'
                })
            }

            // check if the cuisine is valid
            const cuisineDoc = await db.collection('cuisines').findOne({
                name: { $regex: cuisine, $options: 'i' }
            })
            if (!cuisineDoc) {
                return res.status(400).json({
                    "error": "Invalid cuisine"
                })
            }

            // check if prep time must be than 0
            if (prepTime <= 0) {
                return res.status(400).json({
                    'error': 'Prep time cannot be less than 0'
                })
            }

            // check if cooktime is more than 0
            if (cookTime <= 0) {
                return res.status(400).json({
                    'error': 'Cook time cannot be less than 0'
                })
            }

            // servings must be more than 0
            if (servings <= 0) {
                return res.status(400).json({
                    'error': 'Servings must be more than 0'
                })
            }

            // make sure the given tags exist
            const tagDocs = await db.collection('tags').find({
                name: { $in: tags }
            }).toArray();
            if (tagDocs.length !== tags.length) {
                return res.status(400).json({
                    'error': "There are some invalid tags"
                })
            }

            const updatedRecipe = {
                name,
                cuisine: cuisineDoc,
                prepTime,
                cookTime,
                servings,
                ingredients,
                instructions,
                tags: tagDocs,
                // Qn 3c
                dish_type,
            }

            console.log(updatedRecipe);

            const results = await db.collection('recipes').updateOne({
                _id: new ObjectId(req.params.id)
            },
                { $set: updatedRecipe }
            )

            if (results.matchedCount === 0) {
                return res.status(400).json({
                    'error': 'Not found'
                })
            }

            res.json({
                'message': 'Recipe has been updated'
            })

        } catch (e) {
            console.error(e);
            res.status(500).json({
                'error': 'Cannot update'
            })
        }





    })

}
main();



app.listen(3000, function () {
    console.log("Server has started");
})