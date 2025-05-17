const defaultData = {
    users: [
        {
            type: 'resident',
            status: 'approved',
            username: 'dummyuser',
            password: '1234',
            firstName: 'Demo',
            lastName: 'User',
            email: 'demo@example.com',
            phone: '555-0123',
            address: {
                street: '1315 10th Street',
                city: 'Sacramento',
                state: 'CA',
                zipcode: '95814',
                coordinates: {
                    lat: 38.576666,
                    lon: -121.493618
                }
            },
            registrationDate: '2024-01-01T00:00:00.000Z'
        },
        {
            type: 'cityManager',
            status: 'approved',
            username: 'dummymanager',
            password: '1234',
            firstName: 'City',
            lastName: 'Manager',
            email: 'manager@example.com',
            city: {
                name: 'Sacramento',
                state: 'CA',
                coordinates: {
                    lat: 38.576666,
                    lon: -121.493618
                }
            }
        }
    ],
    requests: [
        // SIDEWALK REQUESTS (8 total - distributed across priorities and statuses)
        {
            id: 1,
            type: 'sidewalk',
            description: 'Severe cracks and uplift causing tripping hazard near elderly community center',
            priority: 'high',
            status: 'pending',
            location: [38.576666, -121.493618],
            username: 'dummyuser',
            timestamp: '2024-01-15T10:00:00.000Z',
            estimatedCost: 5200
        },
        {
            id: 2,
            type: 'sidewalk',
            description: 'Section of sidewalk missing after utility work',
            priority: 'high',
            status: 'approved',
            location: [38.578666, -121.494618],
            username: 'dummyuser',
            timestamp: '2024-01-02T15:30:00.000Z',
            estimatedCost: 4800,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-01-03T09:00:00.000Z',
            reviewNotes: 'Utility company will be charged for repairs. High priority due to safety concerns.'
        },
        {
            id: 3,
            type: 'sidewalk',
            description: 'Tree roots causing uneven pavement',
            priority: 'medium',
            status: 'pending',
            location: [38.575666, -121.492618],
            username: 'dummyuser',
            timestamp: '2024-02-05T11:20:00.000Z',
            estimatedCost: 3500
        },
        {
            id: 4,
            type: 'sidewalk',
            description: 'Weather-worn sidewalk needs resurfacing',
            priority: 'low',
            status: 'rejected',
            location: [38.580666, -121.495618],
            username: 'dummyuser',
            timestamp: '2024-01-20T14:45:00.000Z',
            estimatedCost: 2800,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-01-22T16:30:00.000Z',
            reviewNotes: 'Current condition meets safety standards. Will reassess in 6 months.'
        },
        {
            id: 5,
            type: 'sidewalk',
            description: 'Sidewalk too narrow for ADA compliance',
            priority: 'high',
            status: 'approved',
            location: [38.574666, -121.491618],
            username: 'dummyuser',
            timestamp: '2024-02-10T09:15:00.000Z',
            estimatedCost: 7500,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-02-11T10:00:00.000Z',
            reviewNotes: 'Approved for immediate widening to meet ADA requirements.'
        },
        {
            id: 6,
            type: 'sidewalk',
            description: 'Water pooling on sidewalk due to poor drainage',
            priority: 'medium',
            status: 'approved',
            location: [38.577666, -121.496618],
            username: 'dummyuser',
            timestamp: '2024-01-25T13:20:00.000Z',
            estimatedCost: 4200,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-01-27T11:45:00.000Z',
            reviewNotes: 'Will coordinate with stormwater management team for comprehensive fix.'
        },
        {
            id: 7,
            type: 'sidewalk',
            description: 'Sidewalk edge crumbling near bus stop',
            priority: 'medium',
            status: 'pending',
            location: [38.579666, -121.497618],
            username: 'dummyuser',
            timestamp: '2024-02-15T16:10:00.000Z',
            estimatedCost: 3800
        },
        {
            id: 8,
            type: 'sidewalk',
            description: 'New sidewalk needed to connect residential area',
            priority: 'low',
            status: 'approved',
            location: [38.573666, -121.490618],
            username: 'dummyuser',
            timestamp: '2024-01-30T10:30:00.000Z',
            estimatedCost: 9500,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-02-01T14:20:00.000Z',
            reviewNotes: 'Approved as part of neighborhood connectivity project.'
        },

        // STREETLIGHT REQUESTS (8 total)
        {
            id: 9,
            type: 'streetlight',
            description: 'Dark intersection needs lighting for pedestrian safety',
            priority: 'high',
            status: 'approved',
            location: [38.581666, -121.498618],
            username: 'dummyuser',
            timestamp: '2024-01-05T17:45:00.000Z',
            estimatedCost: 3200,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-01-06T09:30:00.000Z',
            reviewNotes: 'Approved for immediate installation due to safety concerns.'
        },
        // ... Continue with more streetlight requests

        // POTHOLE REQUESTS (8 total)
        {
            id: 10,
            type: 'pothole',
            description: 'Deep pothole damaging vehicles on main thoroughfare',
            priority: 'high',
            status: 'approved',
            location: [38.582666, -121.499618],
            username: 'dummyuser',
            timestamp: '2024-01-08T08:15:00.000Z',
            estimatedCost: 800,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-01-08T10:00:00.000Z',
            reviewNotes: 'Emergency repair scheduled.'
        },
        // ... Continue with more pothole requests

        // CROSSING REQUESTS (8 total)
        {
            id: 11,
            type: 'crossing',
            description: 'New crosswalk needed near elementary school',
            priority: 'high',
            status: 'approved',
            location: [38.583666, -121.500618],
            username: 'dummyuser',
            timestamp: '2024-01-12T11:30:00.000Z',
            estimatedCost: 8500,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-01-13T09:15:00.000Z',
            reviewNotes: 'Approved as part of school safety initiative.'
        },
        // ... Continue with more crossing requests

        // BIKE LANE REQUESTS (8 total)
        {
            id: 12,
            type: 'bike',
            description: 'Protected bike lane needed along commercial corridor',
            priority: 'medium',
            status: 'pending',
            location: 
                [38.584666, -121.501618]
            ,
            username: 'dummyuser',
            timestamp: '2024-01-18T14:20:00.000Z',
            estimatedCost: 12000
        },
        // STREETLIGHT REQUESTS (Continuing from id 9)
        {
            id: 13,
            type: 'streetlight',
            description: 'Multiple streetlights out near Capitol Mall',
            priority: 'high',
            status: 'pending',
            location: [38.576891, -121.493550], // Capitol Mall cluster
            username: 'dummyuser',
            timestamp: '2024-01-06T18:30:00.000Z',
            estimatedCost: 3500
        },
        {
            id: 14,
            type: 'streetlight',
            description: 'Flickering lights creating safety hazard',
            priority: 'high',
            status: 'approved',
            location: [38.576950, -121.493650], // Capitol Mall cluster
            username: 'dummyuser',
            timestamp: '2024-01-07T19:15:00.000Z',
            estimatedCost: 2800,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-01-08T09:00:00.000Z',
            reviewNotes: 'Electrical issue affecting multiple lights. Scheduled for urgent repair.'
        },
        {
            id: 15,
            type: 'streetlight',
            description: 'Street light damaged by vehicle collision',
            priority: 'medium',
            status: 'approved',
            location: [38.583671, -121.494563], // Richards Boulevard area
            username: 'dummyuser',
            timestamp: '2024-01-08T14:20:00.000Z',
            estimatedCost: 4200,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-01-09T10:30:00.000Z',
            reviewNotes: 'Insurance claim filed. Replacement scheduled.'
        },
        // Creating a cluster near Midtown for heatmap demonstration
        {
            id: 16,
            type: 'streetlight',
            description: 'Dark alley needs additional lighting',
            priority: 'medium',
            status: 'pending',
            location: [38.573421, -121.485632], // Midtown cluster
            username: 'dummyuser',
            timestamp: '2024-01-10T16:45:00.000Z',
            estimatedCost: 3100
        },
        {
            id: 17,
            type: 'streetlight',
            description: 'Old sodium lights need LED upgrade',
            priority: 'low',
            status: 'approved',
            location: [38.573521, -121.485732], // Midtown cluster
            username: 'dummyuser',
            timestamp: '2024-01-12T11:30:00.000Z',
            estimatedCost: 2500,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-01-13T14:20:00.000Z',
            reviewNotes: 'Approved as part of citywide LED conversion project'
        },
        {
            id: 18,
            type: 'streetlight',
            description: 'Intermittent light malfunction',
            priority: 'low',
            status: 'rejected',
            location: [38.573621, -121.485832], // Midtown cluster
            username: 'dummyuser',
            timestamp: '2024-01-15T13:20:00.000Z',
            estimatedCost: 1800,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-01-16T09:15:00.000Z',
            reviewNotes: 'Temporary issue resolved during inspection'
        },

        // POTHOLE REQUESTS (Creating clusters along major thoroughfares)
        {
            id: 19,
            type: 'pothole',
            description: 'Large pothole causing traffic slowdown',
            priority: 'high',
            status: 'approved',
            location: [38.581234, -121.493456], // J Street cluster
            username: 'dummyuser',
            timestamp: '2024-01-18T08:30:00.000Z',
            estimatedCost: 750,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-01-18T10:45:00.000Z',
            reviewNotes: 'Emergency repair scheduled for tonight'
        },
        {
            id: 20,
            type: 'pothole',
            description: 'Multiple potholes after recent rain',
            priority: 'high',
            status: 'pending',
            location: [38.581334, -121.493556], // J Street cluster
            username: 'dummyuser',
            timestamp: '2024-01-19T09:15:00.000Z',
            estimatedCost: 1200
        },
        {
            id: 21,
            type: 'pothole',
            description: 'Series of potholes damaging vehicles',
            priority: 'high',
            status: 'approved',
            location: [38.581434, -121.493656], // J Street cluster
            username: 'dummyuser',
            timestamp: '2024-01-20T10:20:00.000Z',
            estimatedCost: 900,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-01-20T14:30:00.000Z',
            reviewNotes: 'Part of J Street emergency repair initiative'
        },
        {
            id: 22,
            type: 'pothole',
            description: 'Deep pothole near intersection',
            priority: 'medium',
            status: 'pending',
            location: [38.568901, -121.482356], // Broadway corridor
            username: 'dummyuser',
            timestamp: '2024-01-22T11:45:00.000Z',
            estimatedCost: 600
        },
        {
            id: 23,
            type: 'pothole',
            description: 'Deteriorating road surface with multiple holes',
            priority: 'medium',
            status: 'approved',
            location: [38.568801, -121.482456], // Broadway corridor
            username: 'dummyuser',
            timestamp: '2024-01-23T13:20:00.000Z',
            estimatedCost: 1500,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-01-24T09:30:00.000Z',
            reviewNotes: 'Scheduled for comprehensive repair next week'
        },

        // CROSSING REQUESTS concentrated near schools and commercial areas
        {
            id: 24,
            type: 'crossing',
            description: 'Need crosswalk near Sacramento High School',
            priority: 'high',
            status: 'approved',
            location: [38.563456, -121.472345], // Sac High cluster
            username: 'dummyuser',
            timestamp: '2024-01-25T09:15:00.000Z',
            estimatedCost: 8500,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-01-26T10:00:00.000Z',
            reviewNotes: 'Approved as part of school safety initiative'
        },
        {
            id: 25,
            type: 'crossing',
            description: 'Pedestrian signal needed at busy intersection',
            priority: 'high',
            status: 'pending',
            location: [38.563556, -121.472445], // Sac High cluster
            username: 'dummyuser',
            timestamp: '2024-01-27T14:30:00.000Z',
            estimatedCost: 12000
        },
        {
            id: 26,
            type: 'crossing',
            description: 'Crossing needed near community center',
            priority: 'medium',
            status: 'approved',
            location: [38.571234, -121.489876], // Midtown cluster
            username: 'dummyuser',
            timestamp: '2024-01-28T15:45:00.000Z',
            estimatedCost: 9000,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-01-29T11:20:00.000Z',
            reviewNotes: 'Approved with enhanced lighting features'
        },

        // BIKE LANE REQUESTS creating connected networks
        {
            id: 27,
            type: 'bike',
            description: 'Protected bike lane network in downtown',
            priority: 'high',
            status: 'pending',
            location: 
                [38.575678, -121.493234], // Downtown network
            username: 'dummyuser',
            timestamp: '2024-01-30T10:30:00.000Z',
            estimatedCost: 25000
        },
        {
            id: 28,
            type: 'bike',
            description: 'Bike lane extension to American River Trail',
            priority: 'medium',
            status: 'approved',
            location: 
                [38.591234, -121.492345], // River connection
            username: 'dummyuser',
            timestamp: '2024-02-01T11:15:00.000Z',
            estimatedCost: 18000,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-02-02T09:30:00.000Z',
            reviewNotes: 'Approved as part of river access improvement project'
        },
        {
            id: 29,
            type: 'crossing',
            description: 'Crosswalk needed near McKinley Park',
            priority: 'high',
            status: 'pending',
            location: [38.575123, -121.462789], // McKinley Park area
            username: 'dummyuser',
            timestamp: '2024-02-03T13:45:00.000Z',
            estimatedCost: 8800
        },
        {
            id: 30,
            type: 'crossing',
            description: 'Pedestrian signal upgrade at busy intersection',
            priority: 'medium',
            status: 'approved',
            location: [38.575223, -121.462889], // McKinley Park area
            username: 'dummyuser',
            timestamp: '2024-02-04T14:30:00.000Z',
            estimatedCost: 15000,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-02-05T10:15:00.000Z',
            reviewNotes: 'Approved with countdown timer installation'
        },
        {
            id: 31,
            type: 'crossing',
            description: 'ADA compliant ramps needed at crossing',
            priority: 'high',
            status: 'approved',
            location: [38.575323, -121.462989], // McKinley Park area
            username: 'dummyuser',
            timestamp: '2024-02-06T09:20:00.000Z',
            estimatedCost: 12000,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-02-07T11:30:00.000Z',
            reviewNotes: 'Prioritized for ADA compliance'
        },

        // More BIKE LANE REQUESTS
        {
            id: 32,
            type: 'bike',
            description: 'Bike lane connection to Sacramento City College',
            priority: 'high',
            status: 'pending',
            location: 
                [38.541234, -121.486789], // City College route
            username: 'dummyuser',
            timestamp: '2024-02-08T10:45:00.000Z',
            estimatedCost: 22000
        },
        {
            id: 33,
            type: 'bike',
            description: 'Protected bike lane on Capitol Mall',
            priority: 'medium',
            status: 'approved',
            location:[38.576789, -121.498765]
            , // Capitol Mall
            username: 'dummyuser',
            timestamp: '2024-02-09T11:30:00.000Z',
            estimatedCost: 28000,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-02-10T09:45:00.000Z',
            reviewNotes: 'Approved as part of Capitol Mall renovation'
        },

        // Additional STREETLIGHT clusters in entertainment district
        {
            id: 34,
            type: 'streetlight',
            description: 'Additional lighting needed in DOCO area',
            priority: 'high',
            status: 'pending',
            location: [38.580234, -121.499876], // DOCO area
            username: 'dummyuser',
            timestamp: '2024-02-11T16:20:00.000Z',
            estimatedCost: 4500
        },
        {
            id: 35,
            type: 'streetlight',
            description: 'Replace damaged lights near Golden 1 Center',
            priority: 'medium',
            status: 'approved',
            location: [38.580334, -121.499976], // DOCO area
            username: 'dummyuser',
            timestamp: '2024-02-12T15:30:00.000Z',
            estimatedCost: 3800,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-02-13T10:20:00.000Z',
            reviewNotes: 'Coordinating with event schedule for installation'
        },

        // More POTHOLE clusters
        {
            id: 36,
            type: 'pothole',
            description: 'Multiple potholes on Alhambra Boulevard',
            priority: 'high',
            status: 'pending',
            location: [38.568234, -121.464567], // Alhambra corridor
            username: 'dummyuser',
            timestamp: '2024-02-14T09:15:00.000Z',
            estimatedCost: 2200
        },
        {
            id: 37,
            type: 'pothole',
            description: 'Road surface deterioration near light rail',
            priority: 'medium',
            status: 'approved',
            location: [38.568334, -121.464667], // Alhambra corridor
            username: 'dummyuser',
            timestamp: '2024-02-15T10:30:00.000Z',
            estimatedCost: 1800,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-02-16T11:45:00.000Z',
            reviewNotes: 'Coordinating repairs with RT schedule'
        },

        // Final mixed requests for comprehensive coverage
        {
            id: 38,
            type: 'sidewalk',
            description: 'Sidewalk repairs needed near Land Park',
            priority: 'medium',
            status: 'pending',
            location: [38.541234, -121.503456], // Land Park area
            username: 'dummyuser',
            timestamp: '2024-02-17T13:20:00.000Z',
            estimatedCost: 6500
        },
        {
            id: 39,
            type: 'crossing',
            description: 'New crossing needed at Sacramento Zoo',
            priority: 'high',
            status: 'approved',
            location: [38.541334, -121.503556], // Land Park area
            username: 'dummyuser',
            timestamp: '2024-02-18T14:45:00.000Z',
            estimatedCost: 9500,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-02-19T10:30:00.000Z',
            reviewNotes: 'Approved for zoo accessibility improvement'
        },
        {
            id: 40,
            type: 'bike',
            description: 'Bike lane extension in Land Park',
            priority: 'medium',
            status: 'pending',
            location: [38.541434, -121.503656], // Land Park route
            username: 'dummyuser',
            timestamp: '2024-02-20T11:20:00.000Z',
            estimatedCost: 15000
        },
        {
            id: 41,
            type: 'streetlight',
            description: 'Park pathway lighting upgrade',
            priority: 'low',
            status: 'approved',
            location: [38.541534, -121.503756], // Land Park area
            username: 'dummyuser',
            timestamp: '2024-02-21T15:30:00.000Z',
            estimatedCost: 5500,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-02-22T09:15:00.000Z',
            reviewNotes: 'Part of park safety enhancement project'
        },
        {
            id: 42,
            type: 'pothole',
            description: 'Pothole repairs on William Land Park Drive',
            priority: 'medium',
            status: 'pending',
            location: [38.541634, -121.503856], // Land Park area
            username: 'dummyuser',
            timestamp: '2024-02-23T10:45:00.000Z',
            estimatedCost: 800
        },
        {
            id: 43,
            type: 'sidewalk',
            description: 'New sidewalk connection to light rail station',
            priority: 'high',
            status: 'approved',
            location: [38.541734, -121.503956], // Land Park area
            username: 'dummyuser',
            timestamp: '2024-02-24T11:30:00.000Z',
            estimatedCost: 11000,
            reviewedBy: 'dummymanager',
            reviewDate: '2024-02-25T14:20:00.000Z',
            reviewNotes: 'Approved to improve transit accessibility'
        }


    ]
};