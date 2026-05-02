
## High Level Concept: 

Keep track of a Pantry's Inventory and Allow for its Manipulation

 

## API: 

Create a Storage API for individuals or families that allows for users to Add New Items, Increment, Decrement, and Delete Items. The API will alert when a product is low on inventory, and the API will allow for modification on when the user would like those alerts to appear. 

 

## Front End: 

The Front end will be a simple organization tool where you search for your items in the list and you can call the respective API calls when you want to perform actions on your inventory. You will be given a warning on an items when you are running low and a large Red Warning at the top of the page when you are running critically low on a resource.

 

## Database: 

A Collection of all the items added to the Pantry's inventory
Each Items will contain a quantity, a warning quantity (When should the warning go off), a Boolean if they want an item to have a critical warning at a really low quantities
Each Items will contain an Expiration Date
(Possibly) Contain a collection of most often consumed items so the user knows what they should purchase more of, and vise versa for less consumed items

