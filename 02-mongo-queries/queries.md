# Mongo commands

## General
To see all the databases:

```
show databases
```

### Select a database
```
use <dbname>
```
For example: `use sample_airnb`

```
show collections
```

### Find all documents in a collection
The structure is:
```
db.<collection_name>.find()
```
Example: `db.listingsAndReviews.find()`

### Limit the number of documents returned

Use `.limit`

```
db.listingsAndReviews.find().limit(5)
```

### Projecting a Document
Show only certain keys from a document. Syntax:
```
db.<collection_name>.find({}, {
    <key_to_project>: 1,
    <key_to_project_n>: 1
})
```

Example:
```
db.listingsAndReviews.find({}, {
    "name": 1,
    "address": 1,
    "beds": 1
})
```

Or if we want to blacklist what we don't want (different database shown here):
```
db.recipes.find({}, {"instructions":0})
```

### Find documents by certain criteria

#### Find by a fixed value
find all listings that have exactly 2 beds
```
db.listingsAndReviews.find({
    "beds": 2
}, {
    "name": 1,
    "beds": 1
})
```

Find all listings where the property type is "Apartment"
```
db.listingsAndReviews.find({
    "property_type":"Apartment"
}, {
    "name": 1,
    "property_type":1,
    "beds": 1
})
```

### Find by value of a nested key
Find all listings from Brazil
```
db.listingsAndReviews.find({
    "address.country":"Brazil"
}, {
    "address.country": 1,
    "name": 1,
    "beds": 1
})
```
### Find all distinct values for a key
List all the possible property types
```
db.listingsAndReviews.distinct("property_type")
```

## Searching by multiple criteria
Find all listings in Brazil that are Aparment
```
db.listingsAndReviews.find({
    "address.country":"Brazil",
    "property_type":"Apartment"
}, {
    "address.country": 1,
    "property_type": 1
})
```

Find all listings in Brazil that are apartments with  3 beds.
```
db.listingsAndReviews.find({
    'property_type':'Apartment',
    'address.country':'Brazil',
    'beds': 3
}, {
    'property_type': 1,
    'address.country': 1,
    'beds': 1
})
```

### Finding by a range of value
Find all listings with at least 3 beds
```
db.listingsAndReviews.find({
    "beds": {
        "$gte": 3
    }
}, {
    'name': 1,
    'beds': 1
})
```
```
db.listingsAndReviews.find({
    'property_type':'Apartment',
    'address.country':'Brazil',
    'beds': {
        "$lt": 3
    }
}, {
    'property_type': 1,
    'address.country': 1,
    'beds': 1
})
```
### Find by upper and lower bound
Find all listings that cost between $200 to $500
```
db.listingsAndReviews.find({
    'price':{
        "$gte":200,
        "$lte":500
    }
},{
    'name':1,
    'price':1
})
```

### Find by a value in an array
```
db.listingsAndReviews.find({
    'amenities':'Air conditioning'
}, {
    "name": 1,
    "amenities.$": 1
})
```
The `.$` is the index of the item that fufills the search critera

### Find by multiple values in an array (all)
Find all listings that have BOTH washer and dryer
```
db.listingsAndReviews.find({
    'amenities': {
        '$all':['Washer', 'Dryer']
    }
}, {
    'name': 1,
    'amenities': 1
})
```

### Find by OR values in array
Find all listings that have either Microwave or Oven, or both.
```
db.listingsAndReviews.find({
    'amenities':{
        "$in":["Microwave", "Oven"]
    }
}, {
    'name': 1,
    'amenities': 1
})
```

