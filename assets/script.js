let APIKey = "730ce6df07f032d600c57112c0f97575";
let lsKey = "weatherSearches"
let searchesDiv = $("#searches");
let searchInput = $("#searchInput");
let searchButton = $("#searchBtn");
let currentWeatherDiv = $("#currentWeather");
let forecastDiv = $("#forecast");
let clearBtn = $("#clear");
let storedSearches = getStoredSearches();
let addedCity = newCity();
let metricUnits = {deg:"C", speed:"KPH"};
let impUnits = {deg:"F",speed:"MPH"};
let units = metricUnits;



function init(){

    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    });
    

    buildSearchHistory();

    if(storedSearches != null){
        getWeather(storedSearches[0]);
    }

    searchInput.on("keyup", function (event){
        if (event.key === "Enter") {
            searchButtonClicked();
        }
    });

    searchButton.on("click", searchButtonClicked );
    clearBtn.on("click",clearSearches);    
}

function buildSearchHistory(){
    
    searchesDiv.empty();
    
    if(storedSearches != null){
        storedSearches.forEach(element => {
            searchesDiv.append(
                $("<button>")
                    .text(correctCase(element.city) +", "+element.country.toUpperCase())
                    .addClass("btn btnCitySearch")
                    .on("click", function (){                        
                        getWeather(element);
                    })
            );
        });
    }
}

function searchButtonClicked(){
    
    let cityVal = searchInput.val().trim();
    let city = newCity(cityVal, null);       
    getWeather(city);
    searchInput.val("");        
}

function getWeather(city){
    addedCity = city; 
    let queryURLCurrent = "";
    let queryURLForecast = "";

    if(city.country == null){
        queryURLCurrent = "https://api.openweathermap.org/data/2.5/weather?q="+city.city+"&units=metric&appid="+APIKey;
        queryURLForecast = "https://api.openweathermap.org/data/2.5/forecast?q="+city.city+"&units=metric&appid="+APIKey;
    }else{        
        queryURLCurrent = "https://api.openweathermap.org/data/2.5/weather?q="+city.city+","+city.country+"&units=metric&appid="+APIKey;
        queryURLForecast = "https:////api.openweathermap.org/data/2.5/forecast?q="+city.city+","+city.country+"&units=metric&appid="+APIKey;
    }
    
    performAPIGETCall(queryURLCurrent, buildCurrentWeather);
    performAPIGETCall(queryURLForecast, buildForecastWeather);    
}

function buildCurrentWeather(data){
    if(data != null){
        console.log(units,metricUnits,data.wind.speed);
        currentWeatherDiv.empty();
        currentWeatherDiv.append(
                            $("<h3>").text(correctCase(data.name)+", "
                                    +data.sys.country.toUpperCase())
                            ,$("<h4>").text(moment.unix(data.dt).format("dddd, MMM Do YYYY"))
                            .append($("<img>").attr("src", "https://openweathermap.org/img/wn/"+data.weather[0].icon+"@2x.png")
                                                .addClass("currentWeatherImg")
                                                .attr("data-toggle","tooltip")
                                                .attr("data-placement","right")                                                      
                                                .attr("title",data.weather[0].description)
                                                .tooltip())
                            ,$("<p>").text("Temperature: " + Math.round(data.main.temp) + "°"+units.deg)
                            ,$("<p>").text("Humidity: "+ data.main.humidity+"%")
                            ,$("<p>").text("Wind Speed: "+(Math.round((units === metricUnits)?(data.wind.speed*3.6):data.wind.speed))+" "+units.speed)
                            ,$("<p>").text("UV Index: ").append($("<div>").attr("id", "UVIndex"))
        );

        let UVqueryURL = "https://api.openweathermap.org/data/2.5/uvi?appid="+APIKey+"&lat="+data.coord.lat+"&lon="+data.coord.lon;
        
        performAPIGETCall(UVqueryURL,buildUV);

        if(addedCity.country == null){
            addedCity.country = data.sys.country;
            addedCity.city = data.name;
            addNewSearch(addedCity);
            addedCity = null;
        }
        
    }else{
        alert("Something went wrong getting current weather data, please try again");
    }            
}

function buildUV(data){
    if(data != null){

        let UVIndex = data.value;
        let UVDiv = $("#UVIndex").attr("data-toggle","tooltip");
        let severity = "";
        let UVbg = null;
        let textColor = null;
        let borderColor = null;
        
        if(UVIndex < 2){
            UVbg = "green";
            textColor = "white";
            severity = "Low";
            borderColor = "rgb(16, 129, 16)";
        }else if (UVIndex < 6){
            UVbg = "yellow";
            severity = "Moderate";
            borderColor = "rgb(245, 245, 56)";
        }else if (UVIndex < 8){
            UVbg = "orange";
            severity = "High";
            borderColor = "rgb(255, 184, 51)";
        }else if (UVIndex < 11){
            UVbg = "red";
            textColor = "white";
            severity = "Very high";
            borderColor = "rgb(255, 54, 54)";
        }else{
            UVbg = "violet";
            severity = "Extreme";
            borderColor = "rgb(236, 151, 236)";
        }
        UVDiv.attr("title",severity)
             .attr("data-placement","right")  
             .tooltip()
             .css("backgroundColor",UVbg)
             .css("borderColor",borderColor);
        
        if(textColor != null){
            UVDiv.css("color",textColor);
        }
        UVDiv.text(UVIndex);
    }else{
        alert("Something went wrong getting UV data, please try again");
    }
}

function buildForecastWeather(data){
    if(data != null){
        
        forecastDiv.empty();
        
        let dayCardContainer = $("<div>").attr("id","dayCardContainer").addClass("row")

        forecastDiv.append($("<h3>").text("5-Day Forecast:"),dayCardContainer);        
        dailyData = parseDailyData(data);        

        dailyData.forEach(element => {
            dayCardContainer.append(buildForecastCard(element));
        });
        
    }else{
        alert("Something went wrong getting forecast data, please try again");
    }
}
function parseDailyData(data){

    let dailyData = [];
    for(var i = 5; i < data.list.length; i += 8){
        
        let dataList = data.list[i];

        dailyData.push(newDay(dataList.dt,
                            dataList.weather[0].icon,
                            dataList.weather[0].description,
                            dataList.main.temp,
                            dataList.main.humidity));
    }
    return dailyData;
}

function buildForecastCard(day){
    let dayCard = $("<div>").attr("class","dayCard col-12 col-md-5 col-lg-2");

        dayCard.append(
            $("<label>").text(getDayOfWeek(day.date)),
            $("<label>").text(moment.unix(day.date).format("MMM Do YYYY")),                        
            $("<img>").attr("src","https://openweathermap.org/img/wn/"+day.icon+".png")
                        .attr("data-toggle","tooltip")
                        .attr("data-placement","right")
                        .attr("title",day.description)
                        .tooltip(),
            $("<p>").text("Temperature: " + Math.round(day.temp) + "°"+units.deg),
            $("<p>").text("Humidity: "+ day.humidity+"%")
        );

    return dayCard;
}

function addNewSearch(city){
    if(storedSearches == null){
        storedSearches = [];
    }
    storedSearches.unshift(city);
    
    localStorage.setItem(lsKey,JSON.stringify(storedSearches));

    buildSearchHistory();
}

function clearSearches(){

    localStorage.removeItem(lsKey);
    searchesDiv.empty();
    storedSearches = null;
}
init();

function getDayOfWeek(date){
   return moment.unix(parseInt(date)).format('dddd');
}

function correctCase(str){
    return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

function getStoredSearches(){
    return JSON.parse(localStorage.getItem(lsKey));
}

function newCity(city, country){
    return {city:city,country:country};
}

function performAPIGETCall(queryURL, callbackFunction){    
    $.ajax({url: queryURL, method: "GET"}).then(function(response){
        callbackFunction(response);
    });   
}

function newDay(date,icon,description,temp,humidity){
    return {date: date,icon: icon,description: description, temp: temp, humidity: humidity};
}