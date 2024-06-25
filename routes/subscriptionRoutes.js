const express = require("express");
const router = express.Router();
const { 
    getSubscriptions, 
    createSubscription, 
    getSubscriptionForm, 
    editSubscriptionForm, 
    updateSubscription, 
    deleteSubscription 
} = require("../controllers/subscriptionController");
const fetchCompanyData = require('../services/fetchCompanyData');

// Existing routes
router.route("/").get(getSubscriptions).post(createSubscription);
router.route("/new").get(getSubscriptionForm);
router.route("/edit/:id").get(editSubscriptionForm);
router.route("/update/:id").post(updateSubscription);
router.route("/delete/:id").post(deleteSubscription);

// New route for company suggestions
router.get('/company-suggestions', async (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        const domain = query + '.com'; // This is a simplistic approach; you might want to implement a better way to guess the domain
        const companyData = await fetchCompanyData(domain);

        if (companyData) {
            res.json([{
                name: companyData.name,
                logo: companyData.logo,
                url: companyData.website
            }]);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('Error fetching company suggestions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
