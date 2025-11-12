// npm install axios cheerio 
const axios = require('axios');

// specify the URL of the site to crawl
const targetUrl = 'https://www.stacindex.org/api/catalogs';

// define a crawler function
const crawler = async () => {
    try {
        // request the target website
        const response = await axios.get(targetUrl);
        console.log(response.data);
    } catch (error) {
        // handle any error that occurs during the HTTP request
        console.error(`Error fetching ${targetUrl}: ${error.message}`);
    }
};

crawler();
