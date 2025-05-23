/*
Copyright 2017-2024 SensiML Corporation

This file is part of SensiML™ Piccolo AI™.

SensiML Piccolo AI is free software: you can redistribute it and/or
modify it under the terms of the GNU Affero General Public License
as published by the Free Software Foundation, either version 3 of
the License, or (at your option) any later version.

SensiML Piccolo AI is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public
License along with SensiML Piccolo AI. If not, see <https://www.gnu.org/licenses/>.
*/

/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
import _ from "lodash";
import PropTypes from "prop-types";

import React, { createRef, useEffect, useState, useMemo } from "react";

import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import * as d3 from "d3";
import * as fc from "d3fc";

import LabelColoredName from "components/LabelColoredName";

import useStyles from "./LineChartSegmentsWGLStyle";

const SEGMENT_COLOR = "#0071C5";

const LineChartSegments = ({
  data,
  seriesNameList,
  segmentData,
  newSegment,
  editingSegment,
  onSegmentMove,
  onNewSegmentMove,
  onSetEditedSegment,
}) => {
  const svgRef = createRef();
  const classes = useStyles();

  const [activeEditingSegment, setActiveEditingSegment] = useState(-1);
  const [domainData, setDomainData] = useState([1, 1]);

  const [zoomRangeDomain, setZoomRangeDomain] = useState([0, 0]);
  const [zoomRange, setZoomRange] = useState([0.004, 0.996]);

  const [unselectedSeries, setUnselectedSeries] = useState([]);

  const colors = d3.scaleOrdinal(d3.schemeCategory10).domain([...seriesNameList]);
  const yExtent = fc.extentLinear().accessors([(d) => d.value]);
  const xExtent = fc.extentLinear().accessors([(d) => d.sequence]);
  const xScale = d3.scaleLinear(); // .domain([minScaleX, maxScaleX]);
  const yScale = d3.scaleLinear(); // .domain([minScaleY, maxScaleY]);

  let aciveBrashId = -1;
  let isNewSementCreating = false;

  const getSegmentId = (id) => {
    return `segment_${id}`;
  };

  const dataNavigation = useMemo(() => {
    return data[0];
  }, [data]);

  const dataMainChart = useMemo(() => {
    const nameIndexes = data.reduce((acc, dataItem, index) => {
      if (dataItem[0]?.name) {
        acc[index] = dataItem[0]?.name;
      }
      return acc;
    }, {});
    return data.filter((_el, index) => !unselectedSeries.includes(nameIndexes[index]));
  }, [data, unselectedSeries]);

  const flushSVGArea = () => {
    return new Promise((resolve) => {
      resolve(d3.select(".svg-plot-area").selectAll("g").remove());
    });
  };

  /**
   * d3 elements
   */
  const d3ElementLine = fc
    .seriesCanvasLine()
    .mainValue((d) => d.value)
    .crossValue((d) => d.sequence);

  const d3ElementLineSeries = fc
    .seriesCanvasRepeat()
    .xScale(xScale)
    .yScale(yScale)
    .series(d3ElementLine)
    .decorate((context, _data, index) => {
      if (_data[index][0]?.name) {
        context.strokeStyle = colors(_data[index][0]?.name);
      } else {
        context.strokeStyle = colors(index);
      }
    })
    .orient("horizontal");

  const navigationLineSeries = fc
    .seriesCanvasLine()
    .mainValue((d) => d.value)
    .crossValue((d) => d.sequence)
    .decorate((context) => {
      context.strokeStyle = colors(0);
    });

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  const invertSelection = (selection = [0, 0]) => {
    const start = Math.round(xScale.invert(selection[0]));
    const end = Math.round(xScale.invert(selection[1]));
    return [start, end];
  };

  const handleUnSelectSeries = (checked, sensor) => {
    if (checked) {
      setUnselectedSeries(unselectedSeries.filter((sensorName) => sensorName !== sensor));
    } else if (unselectedSeries.length < seriesNameList.length - 1) {
      // disable to unSelect las item
      setUnselectedSeries([...unselectedSeries, sensor]);
    }
  };

  const handleSegmentChanges = (evt, id) => {
    if (evt.selection) {
      const [start, end] = invertSelection(evt.selection);
      onSegmentMove(start, end, id);
    }
  };

  const handleNewSegmentChanges = (evt, id) => {
    if (evt.selection) {
      const [start, end] = invertSelection(evt.selection);
      onNewSegmentMove(start, end, id);
    }
  };

  const drawEditableSegment = (start, end, color, id) => {
    const container = document.querySelector("d3fc-svg");
    if (!container) {
      return;
    }
    const svgArea = d3.select(container).select("svg");

    setActiveEditingSegment(id);
    if (aciveBrashId !== id) {
      const brushToRemove = svgArea.select(".brushes").select(`#band_brash_${aciveBrashId}`);
      brushToRemove.select(".selection").attr("stroke-width", "0");
    }

    const brashBand = d3.brushX().on("end", (evt) => {
      if (evt?.mode) {
        handleSegmentChanges(evt, id, color);
      }
    });

    const brush = svgArea
      .select(".brushes")
      .append("g")
      .call(brashBand)
      .call(brashBand.move, [xScale(start), xScale(end)])
      .attr("id", `band_brash_${id}`)
      .attr("class", "brash");

    aciveBrashId = id;

    brush.selectAll(".overlay").remove();
    brush
      .selectAll(".selection")
      .attr("fill", color)
      .attr("fill-opacity", "0.5")
      .attr("stroke", SEGMENT_COLOR)
      .attr("stroke-width", "2");
    d3.brushSelection(brush);
  };

  const drawNewSegment = (svgArea, id) => {
    const brashBand = d3.brushX().on("end", (evt) => {
      if (evt?.mode) {
        handleNewSegmentChanges(evt, id);
      }
    });

    const brush = svgArea
      .select(".brushes")
      .append("g")
      .call(brashBand)
      .attr("id", `band_brash_${id}`)
      .attr("class", "brash");

    d3.brushSelection(brush);
  };

  const drawSegmentBand = fc
    .annotationSvgBand()
    .orient("vertical")
    .xScale(xScale)
    .yScale(yScale)
    .fromValue((d) => d.start)
    .toValue((d) => d.end)
    .decorate((sel) => {
      sel
        .attr("id", (d) => getSegmentId(d.id))
        .style("fill", (d) => d.color)
        .style("opacity", "0.5")
        .attr("cursor", "pointer");

      sel.on("click", (e, dataV) => {
        if (!isNewSementCreating) {
          const { start, end, color, id } = dataV;
          onSetEditedSegment(id);
          d3.select(`#${getSegmentId(id)}`).remove();
          drawEditableSegment(start, end, color, id);
        }
      });
    });

  const drawSegments = (newSegmentId, editingSegmentId) => {
    const container = document.querySelector("d3fc-svg");
    if (!container) {
      return;
    }
    const svgArea = d3.select(container).select("svg");

    const activeSegment = editingSegmentId || activeEditingSegment;

    d3.select(container)
      .on("draw", () => {
        const segmentToEdit = segmentData.find((el) => activeSegment === el.id);
        const getData = (_segmentData) => {
          if (zoomRangeDomain[0]) {
            return _segmentData.filter(
              (el) =>
                activeSegment !== el.id &&
                el.start > zoomRangeDomain[0] &&
                zoomRangeDomain[1] > el.end,
            );
          }
          return _segmentData.filter((el) => activeSegment !== el.id);
        };
        d3.select(".svg-plot-area").selectAll("g").remove();
        svgArea.datum(getData(segmentData));
        svgArea.call(drawSegmentBand);
        svgArea.append("g").attr("class", "brushes");

        if (segmentToEdit) {
          drawEditableSegment(
            segmentToEdit.start,
            segmentToEdit.end,
            segmentToEdit.color,
            segmentToEdit.id,
          );
        }
        if (newSegmentId) {
          drawNewSegment(svgArea, newSegmentId);
        }
      })
      .on("measure", (event) => {
        const { width, height } = event.detail;

        xScale.range([0, width]).domain(zoomRangeDomain);
        yScale.range([height, 0]).domain(domainData[1]);
      });

    container.requestRedraw();
  };

  let brushedNavigationRange = [0, 1];

  const handleNavigationBrush = async (evt) => {
    if (evt.selection && evt.selection !== [0, 1]) {
      brushedNavigationRange = evt.selection;
      setZoomRange(brushedNavigationRange);

      const indexRange = [Math.round(evt.xDomain[0]), Math.round(evt.xDomain[1])];
      redraw(indexRange);
    }
  };

  const brushNavigation = fc.brushX().on("brush", handleNavigationBrush);

  const navigationMulti = fc
    .seriesSvgMulti()
    .series([brushNavigation])
    // eslint-disable-next-d3ElementLine consistent-return
    .mapping((_data, index, series) => {
      switch (series[index]) {
        case brushNavigation:
          return brushedNavigationRange;
        default:
          return brushedNavigationRange;
      }
    });

  const navigatorChart = fc
    .chartCartesian(xScale.copy(), yScale.copy())
    .yAxisWidth(0)
    .yDomain(yExtent(data[0]))
    .xDomain(xExtent(data[0]))
    .svgPlotArea(navigationMulti)
    .canvasPlotArea(navigationLineSeries);

  // main

  const multi1 = fc.seriesSvgMulti().series([]);

  const redraw = (indexRange = zoomRangeDomain) => {
    setZoomRangeDomain(indexRange);
    let updData = [...dataMainChart];
    if (!_.isEmpty(indexRange) && d3.select("#chart")) {
      updData = dataMainChart.map((dataItem) =>
        _.filter(dataItem, (el) => el.sequence > indexRange[0] && el.sequence < indexRange[1]),
      );
    }

    const domaninData = updData.reduce((acc, elData) => _.union(acc, elData), []);

    const xDomain = xExtent(domaninData);
    const yDomain = yExtent(domaninData);

    const updChart = fc
      .chartCartesian(xScale, yScale)
      .xDomain(xDomain)
      .yDomain(yDomain)
      .svgPlotArea(multi1)
      .canvasPlotArea(d3ElementLineSeries);

    d3.select("#chart").datum(updData).call(updChart);

    return setDomainData([xDomain, yDomain]);
  };

  useEffect(() => {
    d3.select("#navigator-chart").datum(dataNavigation).call(navigatorChart);
    d3.select(".selection").attr("stroke", "#434242");
    d3.selectAll(".handle")
      .attr("fill", "transparent")
      .attr("heigt", 34)
      .attr("y", 2)
      .attr("style", `outline: 2px solid ${SEGMENT_COLOR}`);
  }, [data]);

  useEffect(() => {
    if (!_.isEmpty(dataMainChart)) {
      redraw();
      brushedNavigationRange = zoomRange;
    }
    d3.select("#navigator-chart").datum(dataNavigation).call(navigatorChart);
  }, [dataMainChart]);

  const clearChart = () => {
    d3.selectAll("#chart").remove("*");
  };

  useEffect(() => {
    return () => clearChart();
  }, []);

  useEffect(() => {
    if (segmentData) {
      drawSegments();
    }
  }, [segmentData, zoomRangeDomain]);

  useEffect(() => {
    if (!_.isEmpty(newSegment)) {
      setActiveEditingSegment(-1);
      isNewSementCreating = true;
      if (!newSegment.start) {
        drawSegments(newSegment.id);
      } else if (newSegment.color) {
        d3.select(`#band_brash_${newSegment.id}`)
          .selectAll(".selection")
          .attr("fill", newSegment.color)
          .attr("fill-opacity", "0.5")
          .attr("stroke", newSegment.color)
          .attr("stroke-width", "2");
      }
    } else {
      isNewSementCreating = false;
      drawSegments();
    }
  }, [newSegment]);

  useEffect(() => {
    if (!_.isEmpty(editingSegment) && activeEditingSegment !== editingSegment.id) {
      setActiveEditingSegment(editingSegment.id);
      drawSegments(undefined, editingSegment.id);
    }
  }, [editingSegment]);

  return (
    <div className="base__container">
      <div id="chart" style={{ height: "500px" }} ref={svgRef} />

      <FormGroup row className={classes.legendWrapper}>
        {seriesNameList.map((sensor) => (
          <FormControlLabel
            key={sensor}
            control={
              <Checkbox
                style={{ display: "none" }}
                checked={!unselectedSeries.includes(sensor)}
                onChange={(event) => handleUnSelectSeries(event.target.checked, sensor)}
                name={sensor}
              />
            }
            label={
              <LabelColoredName
                className={unselectedSeries.includes(sensor) ? classes.unSelectedLegendValue : ""}
                name={sensor}
                color={colors(sensor)}
              />
            }
          />
        ))}
      </FormGroup>

      <div id="navigator-chart" style={{ height: "100px" }} />
    </div>
  );
};

LineChartSegments.propTypes = {
  onSegmentMove: PropTypes.func,
  segmentData: PropTypes.array.isRequired,
};

LineChartSegments.defaultProps = {
  onSegmentMove: () => {},
};

export default LineChartSegments;
