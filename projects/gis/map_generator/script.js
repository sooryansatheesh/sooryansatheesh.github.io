function handleFile(file) {
    // Check if the file is a zip file
    var fileExtension = file.name.substring(file.name.lastIndexOf(".")+1);
    console.log(fileExtension);
    if (fileExtension === "zip") {
        // Use JSZip to extract the contents of the zip file
        const fileExtnList = [];
        JSZip.loadAsync(file)
            .then(zip => {
                // Iterate over each file in the zip archive
                zip.forEach((relativePath, zipEntry) => {
                    // Check if the entry is a file
                    if (!zipEntry.dir) {
                        var fileExtension = zipEntry.name.substring(zipEntry.name.lastIndexOf(".")+1);
                        console.log(fileExtension);
                        fileExtnList.push(fileExtension);
                        console.log(fileExtnList);
                        // // Read the file as text
                        // zipEntry.async('text')
                        //     .then(content => {
                        //         // Process the file content
                        //         // console.log(content);
                        //         console.log(zipEntry.name);
                        //                       })
                        //     .catch(error => {
                        //         console.error('Error reading file:', error);
                        //     });
                    }
                    
                });
                // Check if the list of file extensions has all 
                // the required files of a shape file collection
                const checkShapefileExtensionresult=checkShapefileExtension(fileExtnList);
                if(checkShapefileExtensionresult){
                    // sendData(file);
                    displayShapefile(file);
                }
                    

            })
            .catch(error => {
                console.error('Error loading zip file:', error);
            });
        
    } else {
        console.error('Unsupported file format:', file.name);
    }
}

function checkShapefileExtension(fileExtnList) {

    const x = ["a", "b"];
    const y = ["c", "a", "b", "d"];

    const allElementsPresent = x.every(element => y.includes(element));

    if (allElementsPresent) {
        console.log("All elements of x are present in y.");
    } else {
        console.log("Not all elements of x are present in y.");
    }
    // List of required extensions for an ESRI shapefile
    const requiredExtns = ["shp","prj","shx"];
    console.log("requiredExtns:",requiredExtns);
    console.log("fileExtnList:",fileExtnList);
    // const requiredExtns = fileExtnList;
    // Check if all required extensions are present in fileExtnList
    const allRequiredExtnsPresent = requiredExtns.every(extn => fileExtnList.includes(extn));
    
    if (allRequiredExtnsPresent) {
        console.log('All required extensions for an ESRI shapefile are present.');
    } else {
        console.log('Not all required extensions for an ESRI shapefile are present.');
    }
    return allRequiredExtnsPresent;
}

function sendData(file) {
    // Create FormData object to send the file
    const formData = new FormData();
    formData.append('file', file);

    // Make an HTTP POST request to the external API
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Upload successful:', data);
        // Handle response data as needed
    })
    .catch(error => {
        console.error('Error uploading file:', error);
    });
}

function displayShapefile(zip) {
    // Array to store promises for reading GeoJSON files
    const geojsonPromises = [];
    
    // Iterate over each file in the zip archive
    zip.forEach((relativePath, zipEntry) => {
        // Check if the entry is a file and ends with .geojson
        if (!zipEntry.dir && zipEntry.name.endsWith('.geojson')) {
            // Read the file as text and push the promise to the array
            geojsonPromises.push(zip.file(zipEntry.name).async('text'));
        }
    });

    // When all promises resolve, process GeoJSON files
    Promise.all(geojsonPromises)
        .then(contents => {
            // Parse each GeoJSON content and add it to the map
            contents.forEach(content => {
                const geojson = JSON.parse(content);
                L.geoJSON(geojson).addTo(map);
            });
        })
        .catch(error => {
            console.error('Error reading GeoJSON files:', error);
        });
}
const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadButton');
const map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);
// Add event listener to the submit button
uploadButton.addEventListener('click', function(event) {
    event.preventDefault(); // Prevent default form submission
    
    // Get the selected file
    const selectedFile = fileInput.files[0];
    
    if (selectedFile) { // Check if files is not empty
                
                handleFile(selectedFile); // Pass the file to the handleFile function
            } else {
                console.error('No files selected.'); // Log an error if no files are selected
            }
    
});
// // Handle file input change
// document.getElementById('fileInput').addEventListener('change', function(event) {
//     const files = event.target.files; // Get the files from the event
//     if (files && files.length > 0) { // Check if files is not empty
//         const file = files[0]; // Get the first file from the list
//         handleFile(file); // Pass the file to the handleFile function
//     } else {
//         console.error('No files selected.'); // Log an error if no files are selected
//     }
// });
