const axios = require('axios');
require('dotenv').config();

const fetchCompanyData = async (query) => {
    try {
        const response = await axios.get('https://drive.google.com/uc?export=download&id=1AX9vyWXtUK1FmVJ-n7QSdOtuygimOOFi');
        const companies = response.data;

        const filteredCompanies = companies.filter(company => company.name.toLowerCase().includes(query.toLowerCase()));

        return filteredCompanies;
    } catch (error) {
        console.error('Error fetching company data:', error.message);
        return [];
    }
};

module.exports = fetchCompanyData;
