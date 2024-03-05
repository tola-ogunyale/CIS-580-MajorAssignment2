const height = 800
const width = 1000
const margins = {
    top: 30,
    bottom: 40,
    left: 60,
    right: 30
}

// Select svg
let svg = d3.select('svg')

// Obtain data
d3.csv("data\\data.csv").then(data=>{
    let min_values = []
    let max_values = []
    

    // Add new columns to data object
    data.columns.push("ActualCost", "SoldPrice", "Margin of Profit")

    // Iterate through each row to perform calculations
    data.forEach(row => {
        // Find ActualCost = Raw Material Cost + Workmanship Cost + Storage Cost
        row.ActualCost = +row.RawMaterial + +row.Workmanship + +row.StorageCost
        // Find SoldPrice =  Estimate Cost x 1.1
        row.SoldPrice = +(+row.EstimatedCost * 1.1).toFixed(2)
        // MarginOfProfit  = Sold Price -  Actual Cost
        row["Margin of Profit"] = +(row.SoldPrice - row.ActualCost).toFixed(2)

    })

    // DOMAIN + RANGE
    // Find the range
    let rng = svg.attr('viewBox').split(' ')
    rng = d3.map(rng, function (d){
        return parseInt(d)
    })
    // set x and r range
    let xRng = [rng[0], rng[2]]
    let yRng = [rng[1], rng[3]]

    // Find the data domain
    const colOfInterest = ['EstimatedCost', "ActualCost", "SoldPrice", "Margin of Profit"]

    // Iterate through required 4 columns
    colOfInterest.forEach(col => {
        min_values[col] = d3.min(data, d=> {
            const val = +d[col]
            return !isNaN(val) ? val: undefined
        })
        max_values[col] = d3.max(data, d=> {
            const val = +d[col]
            return !isNaN(val) ? val: undefined
        })
    })

    // Obtain min and max values
    // min and max for money values
    let data_min = Object.values(min_values)
    let data_max = Object.values(max_values)
    
    data_min = d3.min(data_min)
    data_max = d3.max(data_max)
    const data_max_min = [data_max, data_min]

    // min and max for date values
    let date_extent = d3.extent(data, d=>new Date(d.date))    

    // Set scale
    // date values 
    let xScale = d3.scaleTime()
        .domain(date_extent)
        .range([margins.left, width-margins.right])
    // money values 
    let yScale = d3.scaleLinear()
        .domain(data_max_min)
        .range([margins.top, height-margins.bottom])

    // Create axes 
    const xAxis = d3.axisBottom()
        .scale(xScale)
        .ticks(d3.timeMonth)
    const yAxis = d3.axisLeft().scale(yScale)
        .tickValues(d3.range(Math.floor(data_min/100)*100, Math.ceil(data_max+400/100)*100, 200))
        
    // Create lines
    let LineGen_estcost = d3.line()
        .x(function (d){return xScale(new Date(d.date))})
        .y(function (d){return yScale(+d.EstimatedCost)})

    let LineGen_actual = d3.line()
        .x(function (d){return xScale(new Date(d.date))})
        .y(function (d){return yScale(d.ActualCost)})

    let LineGen_sold = d3.line()
        .x(function (d){return xScale(new Date(d.date))})
        .y(function (d){return yScale(d.SoldPrice)})

    let LineGen_margin = d3.line()
        .x(function (d){return xScale(new Date(d.date))})
        .y(function (d){return yScale(d['Margin of Profit'])})


    // Draw to SVG
    // Draw  y axis grid line
    svg.append('g')
        .attr("class","grid")
        .attr("transform", `translate(${margins.left},0)`)
        .call(d3.axisRight().scale(yScale)
                .tickSize(width - 60)
                //.ticks(26)
                .tickValues(d3.range(Math.floor(data_min/100)*100, Math.ceil(data_max+400/100)*100, 200))
                .tickFormat("")
                )
        .selectAll(".tick")
        .filter(d => d === 0) 
        .select("line")
        .style("stroke", "rgba(24,24,24,255)")

    // Draw x axis
    svg.append('g')
        .attr("class", "axis")
        .attr("transform",`translate(0, ${height-margins.bottom})`)
        .call(xAxis.tickFormat(d3.timeFormat("%b '%y")))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-0.8em")
        .attr("dy", "0.15em") 
        .attr("transform", "rotate(-45)") 


    // Draw lines
    let fig = svg.append("g")
    fig = fig.data([data])
    // Estimated Cost Line
    fig.append('path')
        .attr("d", function (d){return LineGen_estcost(d)})
        .attr("class", "estimated")
    // Actual Cost Line
    fig.append('path')
        .attr("d", function (d){return LineGen_actual(d)})
        .attr("class", "actual")
    // Sold Price Line
    fig.append('path')
        .attr("d", function (d){return LineGen_sold(d)})
        .attr("class", "sold")
    // Margin of Profits Line
    fig.append('path')
        .attr("d", function (d){return LineGen_margin(d)})
        .attr("class", "margin")
        

    // Draw y axis
    svg.append('g')
        .attr("class", "axis")
        .attr("transform", `translate(${margins.left},0)`)
        .call(yAxis)
    
    // Draw Legend
    const legend = svg.append('g')
        .attr("class", "legend")
        .attr("transform", "translate(0,10)")
        .selectAll()
        .data([
            {name: colOfInterest[0], class:"legend_estimated"},
            {name: colOfInterest[1], class:"legend_actual"},
            {name: colOfInterest[2], class:"legend_sold"},
            {name: colOfInterest[3], class:"legend_margin"}
            ])
            .enter()
            .append("g")
            .attr("class", d=>d.class)
            .attr("transform", (d,i)=>{
                return `translate(${width/1.3},${i*20})`
            })

        legend.append("rect")
            .attr('width',"8px")
            .attr('height',"8px")
        legend.append("text")
            .text(d=>d.name)
            .attr("dx","20px")
            .attr("dy","10px")

    // Table Formating
    const formatTime = d3.utcFormat("%b '%y")
    data = data.map(d=>{
        return {"Date": formatTime(new Date(d.date)),
                "Estimated Cost": +d.EstimatedCost,
                "Raw Material Cost": +d.RawMaterial,
                "Workmanship Cost":+d.Workmanship,
                "Storage Cost":+d.StorageCost,
                "Actual Cost": d.ActualCost,
                "Sold Price": d.SoldPrice,
                "Margin of Profit": d["Margin of Profit"]
            }
    })
    // Generate table
    TableGenerator(data,"#table_container")

})

// functions
function TableGenerator(data,container){
    const table = d3.selectAll(container)
    .append("Table")
    .selectAll(".rows")
    .data(data)
    .enter()
    .append("tr")
    .selectAll(".td")
    .data((d,i)=> {
        if(i===0){
            return Object.keys(d);
        }
        else{
            return Object.values(d)
        }
    })
    .enter()
    .append("td")
    .text(d=>d)

}
