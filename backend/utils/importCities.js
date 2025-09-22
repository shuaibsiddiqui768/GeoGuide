const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const City = require("../models/City");
const connectDB = require("../config/db");

dotenv.config();
connectDB();

const importCities = async () => {
  try {
    const data = JSON.parse(fs.readFileSync(`${__dirname}/../data/cities.json`, "utf-8"));
    
    if (!data.cities || !Array.isArray(data.cities)) {
      throw new Error("cities.json must have a 'cities' array");
    }

    // Map JSON to match City schema
    const formattedCities = data.cities.map(city => ({
      name: city.cityName,       
      country: city.country,        
      description: city.notes || "",    
      population: city.population || 0,
      imageUrl: "",                 
      position: city.position || {} 
    }));

    await City.deleteMany();  
    await City.insertMany(formattedCities);

    console.log("✅ Cities imported successfully");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

importCities();
