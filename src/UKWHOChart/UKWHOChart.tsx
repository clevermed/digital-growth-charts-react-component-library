// libraries
import React, { useState } from "react";
import { VictoryChart, VictoryGroup, VictoryLine, VictoryScatter, VictoryZoomContainerProps, VictoryVoronoiContainerProps, VictoryTooltip, VictoryAxis, VictoryLegend, VictoryLabel, VictoryArea, Point, createContainer } from 'victory'

// data
import ukwhoData from '../../chartdata/uk_who_chart_data'

// helper functions
import { stndth } from '../functions/suffix'
import { removeCorrectedAge } from "../functions/removeCorrectedAge";
import { measurementSuffix } from "../functions/measurementSuffix";
import { yAxisLabel } from "../functions/yAxisLabel";

// interfaces & props
import { ICentile } from "../interfaces/CentilesObject";
import { UKWHOChartProps } from "./UKWHOChart.types";
import { PlottableMeasurement } from "../interfaces/RCPCHMeasurementObject";

// components/subcomponents
import PRETERMChart from '../PRETERMChart/PRETERMChart'
import { XPoint } from '../SubComponents/XPoint';
import { ChartCircle } from '../SubComponents/ChartCircle';
import { MonthsLabel } from '../SubComponents/MonthsLabel';

// style sheets
import "./UKWHOChart.scss";


// definitions

import { delayedPubertyThreshold, pubertyThresholdBoys, pubertyThresholdGirls } from '../SubComponents/DelayedPuberty'
import { xTickCount } from "../functions/xTickCount";

const VictoryZoomVoronoiContainer = createContainer<VictoryZoomContainerProps, VictoryVoronoiContainerProps>("zoom","voronoi");// allows two top level containers: zoom and voronoi

function UKWHOChart({ 
  title,
  subtitle,
  measurementMethod,
  sex,
  allMeasurementPairs,
  chartStyle,
  axisStyle,
  gridlineStyle,
  centileStyle,
  measurementStyle,
  domains,
  centileData,
  setUKWHODomains,
  isPreterm,
  termUnderThreeMonths
}: UKWHOChartProps) {
  
  /*
  if measurements are provided to plot, test if corrected and chronological ages are different
  if they differ then both chronological and corrected ages need plotting, so the radiobuttons must be visible
  If there is plottable data preterm or < 3/12 of age then only render the preterm chart
  if ther is plottable data preterm/term, but also plottabled data that is older, show the child chart
  */

  let agesDiffer = false
  let showChronologicalAge = true
  let showCorrectedAge = true
  let upperAge = 0
  if (allMeasurementPairs.length > 0){ //test if there are measurements to plot
    if (allMeasurementPairs[0].length > 1){ // test if chronological === decimal age (if the same corrected is removed)
      if (allMeasurementPairs[0][0].x === allMeasurementPairs[0][1].x){
        agesDiffer = false
        upperAge = allMeasurementPairs[allMeasurementPairs.length-1][0].x
      } else {
        agesDiffer = true
        upperAge = allMeasurementPairs[allMeasurementPairs.length-1][1].x
      }
    } else {
      // the chronological and corrected ages are the same, so one has been removed
      showChronologicalAge=true
      showCorrectedAge=false
      upperAge = allMeasurementPairs[allMeasurementPairs.length-1][0].x
    }
  }

  // set state
  const [showPretermChart, setShowPretermChart] = useState((isPreterm || termUnderThreeMonths) && (upperAge < 0.25)); // show preterm chart if preterm or <3/12
  const [showToggle, setShowToggle] = useState(agesDiffer)
  const [chronologicalAge, setChronologicalAge] = useState(showChronologicalAge)
  const [correctedAge, setCorrectedAge] = useState(showCorrectedAge)

  // event callbacks
  const onClickShowPretermChartHandler=(event)=>{
    setShowPretermChart(!showPretermChart)
  }

  const onSelectRadioButton = (event) => {
    switch (event.target.value){
      case "unadjusted":
        setChronologicalAge(true)
        setCorrectedAge(false)
        break
      case "adjusted":
        setChronologicalAge(false)
        setCorrectedAge(true)
        break
      case "both":
        setChronologicalAge(true)
        setCorrectedAge(true)
        break
      default:
        setChronologicalAge(true)
        setCorrectedAge(false)
        break
    }
    
  }

  return ( 
    <div data-testid="UKWHOChart" className="centred">
      {/* The VictoryChart is the parent component. It contains a Voronoi container, which groups data sets together for the purposes of tooltips */}
      {/* It has an animation object and the domains are the thresholds of ages rendered. This is calculated from the child data supplied by the user. */}
      {/* Tooltips are here as it is the parent component. More information of tooltips in centiles below. */}

          {showPretermChart ?
          <PRETERMChart
              title={title}
              subtitle={subtitle}
              measurementMethod={measurementMethod}
              sex={sex}
              allMeasurementPairs={allMeasurementPairs}
              chartStyle={chartStyle}
              axisStyle={axisStyle}
              gridlineStyle={gridlineStyle}
              centileStyle={centileStyle}
              measurementStyle={measurementStyle}
              domains={domains}
              centileData={centileData}
              termUnderThreeMonths={termUnderThreeMonths}
              showChronologicalAge={chronologicalAge}
              showCorrectedAge={correctedAge}
          />
          : 
          <VictoryChart
              width={chartStyle.width}
              height={chartStyle.height}
              style={{
                background: {
                  fill: chartStyle.backgroundColour
                }
              }}
              domain={{x: [domains.x[0]-1,domains.x[1]+1], y: [domains.y[0], domains.y[1]]}}
              minDomain={0}
              maxDomain={20}
              containerComponent={
                  <VictoryZoomVoronoiContainer
                    onZoomDomainChange={
                      (domain, props)=> {
                        let upperXDomain = domain.x[1] as number
                        let lowerXDomain = domain.x[0] as number
                        let upperYDomain = domain.y[1] as number
                        let lowerYDomain = domain.y[0] as number
                        
                        // these prevent overzooming
                        if (lowerXDomain < 0){
                          lowerXDomain=0
                        }
                        if (upperXDomain > 20){
                          upperXDomain = 20
                        }

                        setUKWHODomains([lowerXDomain, upperXDomain], [lowerYDomain, upperYDomain]) // this is a callback function to the parent RCPCHChart component which holds state
                      }
                    }
                    allowPan={true}
                    labelComponent={
                      <VictoryTooltip
                        constrainToVisibleArea
                        pointerLength={5}
                        cornerRadius={0}
                        flyoutStyle={{
                          stroke: chartStyle.tooltipBackgroundColour,
                          fill: chartStyle.tooltipBackgroundColour,
                        }}
                        style={{
                          textAnchor:"start",
                          stroke: chartStyle.tooltipTextColour,
                          strokeWidth: 0.25,
                          fill: chartStyle.tooltipTextColour,
                          fontFamily: 'Montserrat',
                          fontSize: 10
                        }}
                      />
                    }
                    labels={({ datum }) => { // tooltip labels
                      if (datum.l){
                        if (datum.x === 4 ){ // move from UK-WHO data to UK90 data at 4y
                          return "Transit point from\nUK-WHO to UK90 data."
                        }
                        if (datum.x === 2 && measurementMethod==="height"){ // step down at 2 y where children measured standing (height), not lying (length)
                          return "Measure length until age 2;\nMeasure height after age 2.\nA child’s height is usually\nslightly less than their length."
                        }
                        if(datum.l === "For all Children plotted in this shaded area see instructions."){ // delayed puberty if plotted in this area
                          return "For all Children plotted\nin this shaded area\nsee instructions."
                        } else{ 
                          return `${stndth(datum.l)} centile`}
                      } 
                      if (datum.centile_band || datum.observation_value_error || datum.measurement_error) { // these are the measurement points
                        // this is a measurement

                        /// errors 
                      if (datum.measurement_error !== null){
                        
                        // usually requests where there is no reference data
                        if (datum.age_type==="corrected_age"){
                          const finalCorrectedString = datum.lay_corrected_decimal_age_comment.replaceAll(', ', ',\n').replaceAll('. ', '.\n')
                          return "Corrected age: " + datum.corrected_gestation_weeks + "+" + datum.corrected_gestation_days +' weeks gestation\n' + finalCorrectedString + "\n" + datum.y + measurementSuffix(measurementMethod) + '\n' + datum.measurement_error
                        } else {
                          let finalChronologicalString = datum.lay_chronological_decimal_age_comment.replaceAll(', ', ',\n').replaceAll('. ', '.\n')
                            return "Actual age: " + datum.calendar_age + "\n" + finalChronologicalString + "\n" + datum.y + measurementSuffix(measurementMethod) + '\n' + datum.measurement_error
                        }
                      }

                      if (datum.observation_value_error !== null){
                        // usually errors where impossible weights/heights etc
                        
                        // the datum.lay_decimal_age_comment and datum.clinician_decimal_age_comment are long strings
                          // this adds new lines to ends of sentences or commas.
                        if (datum.age_type==="corrected_age"){
                          const finalCorrectedString = datum.lay_corrected_decimal_age_comment.replaceAll(', ', ',\n').replaceAll('. ', '.\n')
                          return "Corrected age: " + datum.corrected_gestation_weeks + "+" + datum.corrected_gestation_days +' weeks gestation\n' + finalCorrectedString + "\n" + datum.y + measurementSuffix(measurementMethod) + '\n' + datum.observation_value_error
                        } else {
                          let finalChronologicalString = datum.lay_chronological_decimal_age_comment.replaceAll(', ', ',\n').replaceAll('. ', '.\n')
                            return "Actual age: " + datum.calendar_age + "\n" + finalChronologicalString + "\n" + datum.y + measurementSuffix(measurementMethod) + '\n' + datum.observation_value_error
                        }
                      }
                        // measurement data points
                        if (datum.x <= 0.0383){ // <= 42 weeks
                          
                          if (datum.age_type==="corrected_age"){
                            
                            if (datum.measurement_error != null){
                              return `${datum.corrected_measurement_error}`
                            }

                            const finalCorrectedString = datum.lay_corrected_decimal_age_comment.replaceAll(', ', ',\n').replaceAll('. ', '.\n')
                            return "Corrected age: " + datum.corrected_gestation_weeks + "+" + datum.corrected_gestation_days +' weeks gestation\n' + finalCorrectedString + "\n" + datum.y + measurementSuffix(measurementMethod) + '\n' + datum.centile_band
                          } else {

                            if (datum.measurement_error != null){
                              return `${datum.chronological_measurement_error}`
                            }

                            let finalChronologicalString = datum.lay_chronological_decimal_age_comment.replaceAll(', ', ',\n').replaceAll('. ', '.\n')
                            return "Actual age: " + datum.calendar_age + "\n" + finalChronologicalString + "\n" + datum.y + measurementSuffix(measurementMethod) + '\n' + datum.centile_band
                          }
                        } else {

                          if (datum.corrected_measurement_error){
                            return `${datum.chronological_measurement_error}`
                          }

                          if (datum.age_type==="corrected_age"){
                            const finalCorrectedString = datum.lay_corrected_decimal_age_comment.replaceAll(', ', ',\n').replaceAll('. ', '.\n')
                            return "Corrected age: " + datum.calendar_age +'\n' + finalCorrectedString + '\n' + datum.y + measurementSuffix(measurementMethod) + '\n' + datum.centile_band
                          }
                          let finalChronologicalString = datum.lay_chronological_decimal_age_comment.replaceAll(', ', ',\n').replaceAll('. ', '.\n')
                          return "Actual age: " + datum.calendar_age +'\n' + finalChronologicalString + "\n" + datum.y + measurementSuffix(measurementMethod) + '\n' + datum.centile_band
                        }
                      }
                      if (datum.l){ // these are the centile lines
                        return `${stndth(datum.l)} centile`
                      } 
                    }}
                    voronoiBlacklist={['linkLine']}
                  />
              }
          >
              {/* the legend postion must be hard coded. It automatically reproduces and labels each series - this is hidden with data: fill: "transparent" */}
              <VictoryLegend
                title={[title, subtitle]}
                centerTitle
                titleOrientation="top"
                orientation="horizontal"
                style={{ 
                  data: { 
                    fill: "transparent" 
                  },
                  title: {
                    fontFamily: "Arial"
                  }
                }}
                x={chartStyle.width/2-50}
                y={0}
                data={[]}
              />

              {/* Render the x axes - there are 3: one for years, one for months, one for weeks*/}
              {/* Preterm babies are plotted in a separate chart. */}
              {/* Months are rendered with lollipop ticks, a custom component */}

                {/* X axis in Years  - rendered if there are  plotted child measurements and the max value is > 2y, or no measurements supplied */}
                {  domains.x[1] > 2 && //render years x axis only if upper domain > 2 or highest supplied measurement > 2y //|| (allMeasurementPairs.length > 0 ? allMeasurementPairs[allMeasurementPairs.length-1][0]["x"]> 2 : false)
                    <VictoryAxis
                      minDomain={0}
                      label="Age (years)"
                      style={{
                        axis: {
                          stroke: axisStyle.axisStroke,
                        },
                        axisLabel: {
                          fontSize: axisStyle.axisLabelSize, 
                          padding: 20,
                          color: axisStyle.axisStroke,
                          fontFamily: axisStyle.axisLabelFont
                        },
                        ticks: {
                          stroke: axisStyle.axisStroke 
                        },
                        tickLabels: {
                          fontSize: axisStyle.tickLabelSize, 
                          padding: 5,
                          color: axisStyle.axisLabelColour
                        },
                        grid: { 
                          stroke: ()=> gridlineStyle.gridlines ? gridlineStyle.stroke : null,
                          strokeWidth: gridlineStyle.strokeWidth,
                          strokeDasharray: gridlineStyle.dashed ? '5 5' : null
                        }
                      }}
                      tickLabelComponent={
                        <VictoryLabel 
                          dy={0}
                          style={[
                            { fill: axisStyle.axisStroke, 
                              fontSize: axisStyle.axisLabelSize,
                              fontFamily: axisStyle.axisLabelFont
                            },
                          ]}
                        />
                      }
                      tickCount={xTickCount(domains.x[0], domains.x[1], "years")}
                      tickFormat={(t)=> Math.round(t)}
                    /> 
              }

              {/* X axis in Months - rendered if child measurements exist and the max age < 2 but > 2 weeks */}

              {  domains.x[1] <= 2 &&
                  <VictoryAxis
                      minDomain={0}
                      label="months"
                      axisLabelComponent={
                        <MonthsLabel 
                          style={{
                            fontFamily: axisStyle.axisLabelFont,
                            fontSize: axisStyle.axisLabelSize
                          }}
                        />
                      }
                      style={{
                        axis: {
                          stroke: axisStyle.axisStroke,
                        },
                        axisLabel: {
                          fontSize: axisStyle.axisLabelSize, 
                          padding: 20,
                          color: axisStyle.axisStroke,
                          fontFamily: axisStyle.axisLabelFont
                        },
                        ticks: {
                          stroke: axisStyle.axisStroke,
                        },
                        tickLabels: {
                          fontSize: axisStyle.tickLabelSize, 
                          padding: 5,
                          color: axisStyle.axisLabelColour
                        },
                        grid: { 
                          stroke: ()=> gridlineStyle.gridlines ? gridlineStyle.stroke : null,
                          strokeWidth: gridlineStyle.strokeWidth,
                          strokeDasharray: gridlineStyle.dashed ? '5 5' : null
                        }
                      }}
                      tickLabelComponent={
                        <ChartCircle style={{
                          stroke: axisStyle.axisLabelColour
                        }}/>
                      }
                      tickValues={[0, 0.083333, 0.166666, 0.249999, 0.333332, 0.416665, 0.499998, 0.583331, 0.666664, 0.749997, 0.83333, 0.916663, 0.999996, 1.083329, 1.166662, 1.249995, 1.333328, 1.416661, 1.499994, 1.583327, 1.66666, 1.749993, 1.833326, 1.916659, 1.999992]}
                      tickCount={12}
                      tickFormat={(t)=> {
                        if(Math.round(t*12)%2===0){
                          return Math.round(t*12)
                        } else {
                          return ''
                        } }}
                  /> }

              {/* X axis in Weeks only: rendered if upper x domain of chart is <=2y */}
                {  (domains.x[1] <= 2) &&
                    <VictoryAxis
                      label="Age (weeks)"
                      minDomain={0}
                      style={{
                        axis: {
                          stroke: axisStyle.axisStroke,
                        },
                        axisLabel: {
                          fontSize: axisStyle.axisLabelSize, 
                          padding: 20,
                          color: axisStyle.axisStroke,
                          fontFamily: axisStyle.axisLabelFont
                        },
                        ticks: {
                          stroke: axisStyle.axisStroke 
                        },
                        tickLabels: {
                          fontSize: axisStyle.tickLabelSize, 
                          padding: 5,
                          color: axisStyle.axisLabelColour
                        },
                        grid: { 
                          stroke: ()=> gridlineStyle.gridlines ? gridlineStyle.stroke : null,
                          strokeWidth: gridlineStyle.strokeWidth,
                          strokeDasharray: gridlineStyle.dashed ? '5 5' : null
                        }
                      }}
                      tickLabelComponent={
                        <VictoryLabel 
                          dy={0}
                          style={[
                            { fill: axisStyle.axisLabelColour, 
                              fontSize: axisStyle.tickLabelSize,
                              fontFamily: axisStyle.axisLabelFont
                            },
                          ]}
                        />
                      }
                      tickValues={[0,0.03846,0.11538,0.1923,0.26922,0.34614,0.42306,0.49998,0.5769,0.65382,0.73074,0.80766,0.88458,0.9615,1.03842,1.11534,1.19226,1.26918,1.3461,1.42302,1.49994,1.57686,1.65378,1.7307,1.80762,1.88454,1.96146,2.03838,2.07684,2.1153,2.15376,2.19222,2.23068,2.26914,2.3076,2.34606,2.38452,2.42298,2.46144,2.4999,2.53836,2.57682,2.61528,2.65374,2.6922,2.73066,2.76912,2.80758,2.84604,2.8845,2.92296,2.96142,2.99988,3.03834,3.0768,3.11526,3.15372,3.19218,3.23064,3.2691,3.30756,3.34602,3.38448,3.42294,3.4614,3.49986,3.53832,3.57678,3.61524,3.6537,3.69216,3.73062,3.76908,3.80754,3.846,3.88446,3.92292,3.96138,3.99984]}
                      tickFormat={(t)=> Math.round(t*52)%2===0 ? Math.round(t*52) : ''}
                    /> 
                }

              {/* These are the puberty threshold lines - the boys are a year above the girls */}

              { domains.x[1]> 7.5 && sex==="male" && measurementMethod==="height" && // puberty threshold lines boys UK90
                pubertyThresholdBoys.map((data, index)=> {
                  return (
                    <VictoryAxis dependentAxis
                      key={index}
                      label={data.label}
                      axisLabelComponent = {
                        <VictoryLabel 
                          dy={20} 
                          dx={-190}
                          textAnchor="start"
                          style={{
                            fontSize: 8,
                            color: axisStyle.axisLabelColour,
                            fontFamily: axisStyle.axisLabelFont,
                            textAlign: "start"
                          }}
                        />}
                      style={{ 
                        axis: {
                          stroke: 'black',
                          strokeWidth: 1.0
                        },
                        tickLabels: 
                        { 
                          fill: "none", 
                        }
                      }}
                      axisValue={data.x}
                    />
                  );
                })
              }

              { domains.x[1] > 12.5 && sex==="female" && measurementMethod==="height" && // puberty threshold lines uk90 girls
                pubertyThresholdGirls.map((data, index)=> {
                  return (
                    <VictoryAxis dependentAxis
                      key={index}
                      label={data.label}
                      axisLabelComponent = {
                        <VictoryLabel 
                          dy={20} 
                          dx={-190}
                          style={{
                            fontSize: 8,
                            color: axisStyle.axisLabelColour,
                            fontFamily: axisStyle.axisLabelFont,
                            textAlign: "start"
                          }}
                        />
                      }
                      style={{ 
                        axis: {
                          stroke: 'black',
                          strokeWidth: 1.0
                        },
                        tickLabels: 
                        { 
                          fill: "none", 
                        },
                        axisLabel: {
                          
                        }
                      }}
                      axisValue={data.x}
                    />
                  );
                })
              }

              {/* render the y axis */}

              {  
                <VictoryAxis // this is the y axis
                  minDomain={0}
                  orientation="left"
                  label={yAxisLabel(measurementMethod)}
                  style= {{
                    axis: {
                      stroke: axisStyle.axisStroke,
                      strokeWidth: 1.0
                    },
                    axisLabel: {
                      fontSize: axisStyle.axisLabelSize, 
                      padding: 20,
                      color: axisStyle.axisLabelColour,
                      fontFamily: axisStyle.axisLabelFont
                    },
                    ticks: {
                      stroke: axisStyle.axisLabelColour
                    },
                    tickLabels: {
                      fontSize: axisStyle.tickLabelSize, 
                      padding: 5,
                      color: axisStyle.axisLabelColour,
                      fontFamily: axisStyle.axisLabelColour
                    },
                    grid: { 
                      stroke: gridlineStyle.gridlines ? gridlineStyle.stroke : null, 
                      strokeWidth: ({t})=> t % 5 === 0 ? gridlineStyle.strokeWidth + 0.5 : gridlineStyle.strokeWidth,
                      strokeDasharray: gridlineStyle.dashed ? '5 5' : ''
                    }}}
                  dependentAxis />   
              }

              {/* This is the shaded area below the 0.4th centile in late childhood/early adolescence */}
              {/* Any measurements plotting here are likely due to delayed puberty */}
              {/* The upper border is the 0.4th centile so this must come before the centiles */}

              { domains.x[1] > 7 && sex==="male" && measurementMethod=="height" && //puberty delay shaded area boys

              <VictoryArea          
                data={delayedPubertyThreshold(ukwhoData.uk90_child[sex][measurementMethod][0].data, sex)}
                y0={(d)=> (d.x >= 9 && d.x <=14) ? d.y0 : null}
                style={{
                  data: {
                    stroke: centileStyle.delayedPubertyAreaFill,
                    fill: centileStyle.delayedPubertyAreaFill,
                    strokeWidth: centileStyle.centileStrokeWidth
                  }
                }}
                name="delayed"
              />

              }

              { domains.x[1] > 7 && sex==="female" && measurementMethod=="height" && //puberty delay shaded area boys

              <VictoryArea          
                data={delayedPubertyThreshold(ukwhoData.uk90_child[sex][measurementMethod][0].data, sex)}
                y0={(d)=> (d.x >= 8.6 && d.x <=13) ? d.y0 : null}
                style={{
                  data: {
                    stroke: centileStyle.delayedPubertyAreaFill,
                    fill: centileStyle.delayedPubertyAreaFill,
                    strokeWidth: centileStyle.centileStrokeWidth
                  }
                }}
                name="delayed"
              />

              }
             

              {/* Render the centiles - loop through the data set, create a line for each centile */}  
              {/* On the old charts the 50th centile was thicker and darker and this lead parents to believe it was therefore */}
              {/* the line their children should follow. This was a design mistake, since it does not matter which line the child is on  */}
              {/* so long as they follow it. The middle line was therefore 'deemphasised' on the newer charts. */}
              {/* For each reference data set, there are 9 centiles. The 0.4th, 9th, 50th, 91st, 99.6th are all dashed. */}
              {/* The 2nd, 25th, 75th, 98th are all continuous lines. As there are 4 datasets, this means 36 separate line series to render. */}
              {/* It is essential each centile from each reference is plotted as a series to prevent interpolation between centiles of one reference  */}
              {/* and centiles of another. The discontinuos lines reflect the transition between references and are essential */}
              {/* One final line is the VictoryArea, which represents the shaded area at the onset of puberty. Children that plot here */}
              {/* will have delayed puberty. */}
              {/* Tooltips are found in the parent element (VictoryChart). Tooltips included: */}
              {/* 1 for each centile, 1 for the shaded area, 1 at 2years to indicate children are measured standing leading */}
              {/* to a step down in height weight and bmi in the data set. There is another tool tip at 4 years to indicate transition from datasets. */}

              { centileData.map((reference, index)=>{
                if (index===0){ // do not want to render preterm data - this will leave a 2 week gap from 0 to 2 weeks
                  return
                }
                if (reference.length > 0){
                  return (<VictoryGroup key={index}>
                    {reference.map((centile:ICentile, centileIndex: number)=>{
                      if (centileIndex % 2 === 0) { // even index - centile is dashed
                        return (
                        <VictoryLine
                            key={centile.centile + '-' + centileIndex}
                            padding={{ top: 20, bottom: 60 } }
                            data={centile.data}
                            style={{
                            data: {
                                stroke: centileStyle.centileStroke,
                                strokeWidth: centileStyle.centileStrokeWidth,
                                strokeLinecap: 'round',
                                strokeDasharray: '5 5'
                            }
                            }}
                        />
                        )
                      } else { // uneven index - centile is continuous
                          return (
                          <VictoryLine
                              key={centile.centile + '-' + centileIndex}
                              padding={{ top: 20, bottom: 60 }}
                              data={centile.data}
                              style={{
                              data: {
                                  stroke: centileStyle.centileStroke,
                                  strokeWidth: centileStyle.centileStrokeWidth,
                                  strokeLinecap: 'round'
                              }
                              }}
                          />
                          )
                      }
                    })
                  }
                  </VictoryGroup>
                  )
                }})
              }

              {/* create a series for each child measurements datapoint: a circle for chronological age, a cross for corrected - if the chronological and corrected age are the same, */}
              {/* the removeCorrectedAge function removes the corrected age to prevent plotting a circle on a cross, and having duplicate */}
              {/* text in the tool tip */}
              
              { allMeasurementPairs.map((measurementPair: [PlottableMeasurement, PlottableMeasurement], index) => {
                
                let match=false
                if(measurementPair.length > 1){
                  
                  const first = measurementPair[0]
                  const second = measurementPair[1]
                  match = first.x===second.x
                } else {
                  match=true
                }
                return (
                    <VictoryGroup
                      key={'measurement'+index}
                    >
                      { match  ?
                      
                      
                      <VictoryScatter // chronological age
                          data={measurementPair.length > 1 ? removeCorrectedAge(measurementPair) : measurementPair}
                          symbol={ measurementStyle.measurementShape }
                          style={{ data: { fill: measurementStyle.measurementFill } }}
                          name='same_age' 
                      />

                      :
                      
                      <VictoryScatter // corrected age - a custom component that renders a dot or a cross
                          data={measurementPair}
                          dataComponent={
                            <XPoint 
                              showChronologicalAge={chronologicalAge}
                              showCorrectedAge={correctedAge}
                            />
                          }
                        style={{ data: 
                          { fill: measurementStyle.measurementFill } 
                        }}
                        name= 'split_age'
                      />
                      
                    }
                    { chronologicalAge && correctedAge && // only show the line if both cross and dot are rendered
                      <VictoryLine
                        name="linkLine"
                        style={{ 
                          data: { stroke: measurementStyle.measurementFill, strokeWidth: 1.25 },
                        }}
                        data={measurementPair}
                      /> 
                    }
                     </VictoryGroup> 
                  )
              })
              
            }
              </VictoryChart>}
              <span style={{display: "inline-block"}}>
              { (isPreterm || termUnderThreeMonths) &&
                <button 
                  onClick={onClickShowPretermChartHandler}
                  style={{
                    backgroundColor: "#cb3083",
                    border: "none",
                    padding: 5,
                    margin: 5,
                    color: "white"
                  }}
                >{showPretermChart ? "Show Child Chart" : "Show Preterm Chart"}</button>
              }
              { showToggle &&
                <div className="radio-toolbar" onChange={onSelectRadioButton}>
                  <input type="radio" id="adjusted" value="adjusted" name="adjustments"  checked={correctedAge && chronologicalAge===false}/>
                  <label htmlFor="adjusted">Adjusted Age</label>
                  <input type="radio" id="unadjusted"value="unadjusted" name="adjustments" checked={chronologicalAge && correctedAge===false} />
                  <label htmlFor="unadjusted">Unadjusted Age</label>
                  <input type="radio" id="both" value="both" name="adjustments" checked={correctedAge === chronologicalAge}/>
                  <label htmlFor="both">Both Ages</label>
                </div>
              }
              </span>
      </div>
  );
}

export default UKWHOChart;