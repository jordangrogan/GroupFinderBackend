const express = require('express')
const request = require('request-promise')
const app = express()
const port = process.env.PORT || 3000

// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

app.get('/', (req, res) => {

    let groups = []
    let offset = 0
        // TODO: The max number of groups is 100, need to refactor for pagination

    const getGroups = request.get({
        uri: `https://api.planningcenteronline.com/groups/v2/group_types/4330/groups?per_page=100&offset=${offset}`,
        method: 'GET',
        json: true
    }).auth(process.env.PCO_APP_ID, process.env.PCO_SECRET, false).then((body) => {

        body["data"].forEach(group => {
            groups.push({
                id: group.id,
                name: group.attributes.name,
                leader: null,
                leaderemail: null,
                leaderphone: null,
                lat: null,
                long: null,
                filters: {
                    typeMens: false,
                    typeWomens: false,
                    typeMixed: false,
                    age20s: false,
                    age30s: false,
                    age40s: false,
                    age50s: false,
                    age60splus: false,
                    daySun: false,
                    dayMon: false,
                    dayTues: false,
                    dayWed: false,
                    dayThurs: false,
                    dayFri: false,
                    daySat: false,
                    timeMorning: false,
                    timeAfternoon: false,
                    timeEvening: false,
                    childcare: false,
                    noChildcare: false
                }
            })
        })

    }).catch(error => { console.log(error.message) })

    // Get group leaders & long/lat of location & filters once groups are loaded
    getGroups.then(() => {

        groups.forEach((group, i) => {

            // Get group leaders
            request.get({
                uri: `https://api.planningcenteronline.com/groups/v2/groups/${group.id}/memberships?where[role]=leader`,
                method: 'GET',
                json: true
            }).auth(process.env.PCO_APP_ID, process.env.PCO_SECRET, false).then(body => {

                // TODO: multiple leaders
                groups[i].leader = `${body.data[0].attributes.first_name} ${body.data[0].attributes.last_name}`
                groups[i].leaderemail = body.data[0].attributes.email_address
                groups[i].leaderphone = body.data[0].attributes.phone_number

            }).catch(error => { console.log(error.message) })

            // Get long/lat of location
            request.get({
                uri: `https://api.planningcenteronline.com/groups/v2/groups/${group.id}/location`,
                method: 'GET',
                json: true
            }).auth(process.env.PCO_APP_ID, process.env.PCO_SECRET, false).then(body => {

                groups[i].lat = body.data.attributes.latitude
                groups[i].long = body.data.attributes.longitude

            }).catch(error => { console.log(error.message) })

        })

        // Go through each filter & mark the appropriate groups

        // typeMens
        request.get({
            uri: `https://api.planningcenteronline.com/groups/v2/tag_groups/253620/tags/1014484/groups`,
            method: 'GET',
            json: true
        }).auth(process.env.PCO_APP_ID, process.env.PCO_SECRET, false).then(body => {
            body.data.forEach(group => {
                groups.find(g => g.id === group.id).filters.typeMens = true
            })
        }).catch(error => { console.log(error.message) })

        // typeWomens
        request.get({
            uri: `https://api.planningcenteronline.com/groups/v2/tag_groups/253620/tags/1014485/groups`,
            method: 'GET',
            json: true
        }).auth(process.env.PCO_APP_ID, process.env.PCO_SECRET, false).then(body => {
            body.data.forEach(group => {
                groups.find(g => g.id === group.id).filters.typeWomens = true
            })
        }).catch(error => { console.log(error.message) })

        // typeMixed
        request.get({
            uri: `https://api.planningcenteronline.com/groups/v2/tag_groups/253620/tags/1014486/groups`,
            method: 'GET',
            json: true
        }).auth(process.env.PCO_APP_ID, process.env.PCO_SECRET, false).then(body => {
            body.data.forEach(group => {
                groups.find(g => g.id === group.id).filters.typeMixed = true
            })
        }).catch(error => { console.log(error.message) })

    })

    setTimeout(() => {
        res.send(groups)
    }, 2000)

})

app.listen(port, () => console.log(`PlanAVisit app listening on port ${port}!`))