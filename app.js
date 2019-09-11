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
                    college: false,
                    age20s: false,
                    age30s: false,
                    age40s: false,
                    age50s: false,
                    age60s: false,
                    age70splus: false,
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

        const filtersTags = [
            { filterName: "typeMens", tagURI: "https://api.planningcenteronline.com/groups/v2/tag_groups/253620/tags/1014484/groups" },
            { filterName: "typeWomens", tagURI: "https://api.planningcenteronline.com/groups/v2/tag_groups/253620/tags/1014485/groups" },
            { filterName: "typeMixed", tagURI: "https://api.planningcenteronline.com/groups/v2/tag_groups/253620/tags/1014486/groups" },
            { filterName: "college", tagURI: "https://api.planningcenteronline.com/groups/v2/tag_groups/8935/tags/35816/groups" },
            { filterName: "age20s", tagURI: "https://api.planningcenteronline.com/groups/v2/tag_groups/8935/tags/1041966/groups" },
            { filterName: "age30s", tagURI: "https://api.planningcenteronline.com/groups/v2/tag_groups/8935/tags/1041961/groups" },
            { filterName: "age40s", tagURI: "https://api.planningcenteronline.com/groups/v2/tag_groups/8935/tags/1041962/groups" },
            { filterName: "age50s", tagURI: "https://api.planningcenteronline.com/groups/v2/tag_groups/8935/tags/1041963/groups" },
            { filterName: "age60s", tagURI: "https://api.planningcenteronline.com/groups/v2/tag_groups/8935/tags/1041964/groups" },
            { filterName: "age70splus", tagURI: "https://api.planningcenteronline.com/groups/v2/tag_groups/8935/tags/1041965/groups" },
            { filterName: "daySun", tagURI: "https://api.planningcenteronline.com/groups/v2/tag_groups/253648/tags/1041953/groups" },
            { filterName: "dayMon", tagURI: "https://api.planningcenteronline.com/groups/v2/tag_groups/253648/tags/1041954/groups" },
            { filterName: "dayTues", tagURI: "https://api.planningcenteronline.com/groups/v2/tag_groups/253648/tags/1041955/groups" },
            { filterName: "dayWed", tagURI: "https://api.planningcenteronline.com/groups/v2/tag_groups/253648/tags/1041956/groups" },
            { filterName: "dayThurs", tagURI: "https://api.planningcenteronline.com/groups/v2/tag_groups/253648/tags/1041957/groups" },
            { filterName: "dayFri", tagURI: "https://api.planningcenteronline.com/groups/v2/tag_groups/253648/tags/1041958/groups" },
            { filterName: "daySat", tagURI: "https://api.planningcenteronline.com/groups/v2/tag_groups/253648/tags/1041959/groups" },
            { filterName: "timeMorning", tagURI: "https://api.planningcenteronline.com/groups/v2/tag_groups/253647/tags/1014633/groups" },
            { filterName: "timeAfternoon", tagURI: "https://api.planningcenteronline.com/groups/v2/tag_groups/253647/tags/1014634/groups" },
            { filterName: "timeEvening", tagURI: "https://api.planningcenteronline.com/groups/v2/tag_groups/253647/tags/1014635/groups" },
            { filterName: "childcare", tagURI: "https://api.planningcenteronline.com/groups/v2/tag_groups/8939/tags/35830/groups" }
        ]

        // For each tag, get the list of groups for that tag, set that filter to true for those groups
        filtersTags.forEach(filter => {
            request.get({
                uri: filter.tagURI,
                method: 'GET',
                json: true
            }).auth(process.env.PCO_APP_ID, process.env.PCO_SECRET, false).then(body => {
                body.data.forEach(group => {
                    groups.find(g => g.id === group.id).filters[filter.filterName] = true
                })
            }).catch(error => { console.log(error.message) })
        })

    })

    setTimeout(() => {
        res.send(groups)
    }, 2000)

})

app.listen(port, () => console.log(`PlanAVisit app listening on port ${port}!`))