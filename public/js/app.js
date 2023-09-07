// Some DataSets are massive and will bring any web browser to its knees if you
// try to load the entire thing. To keep your app performing optimally, take
// advantage of filtering, aggregations, and group by's to bring down just the
// data your app needs. Do not include all columns in your data mapping file,
// just the ones you need.
//
// For additional documentation on how you can query your data, please refer to
// https://developer.domo.com/docs/dev-studio/dev-studio-data

const olympics_medals = document.getElementById('olympics_medals');

olympics_medals.addEventListener('change', () => {
  
  if (olympics_medals.value === '') {
    alert('please, select the medal!')
  } else if (olympics_medals.value === 'Bronze'){

    chartAnalysis('Bronze');

  } else if (olympics_medals.value === 'Silver'){
    chartAnalysis('Silver');

  } else if (olympics_medals.value === 'Gold'){
    chartAnalysis('Gold');
  }
})




document.getElementById('play-controls').style.display = 'none';

function chartAnalysis(medal){

  document.getElementById('loading').innerHTML = 'loading...';
  document.getElementById('parent-container').style.display = 'none';

  
  domo.get(`/data/v2/olympics?filter=Medal==${medal}`)
    .then(function (response) {


      document.getElementById('loading').innerHTML = '';
      document.getElementById('parent-container').style.display = 'block';
      document.getElementById('play-controls').style.display = 'block';

      const sportsName = [];
      const sportsYears = [];

      response.forEach(element => {
        sportsName.push(element.Sport)
        sportsYears.push(element.Year)
      });

      const uniqueSports = sportsName.filter((item, index) => sportsName.indexOf(item) === index);
      const uniqueSportsYear = sportsYears.filter((item, index) => sportsYears.indexOf(item) === index).sort();

      const arr = [];

      uniqueSports.forEach((a) => {
        response.forEach((b) => {
          if (a === b.Sport) {
            arr.push({
              sport: b.Sport,
              year: b.Year
            })
          }
        })
      });


      const counts = {}; // Create an empty object to store counts
      const duplicates = [];

      for (const item of arr) {
        // Convert the object to a string so it can be used as a key in the counts object
        const key = JSON.stringify(item);

        // Check if the key already exists in counts
        if (counts[key]) {
          counts[key]++;
        } else {
          counts[key] = 1;
        }
      }

      for (const key in counts) {
        if (counts[key] >= 1) {
          // Convert the key back to an object
          const duplicateObject = JSON.parse(key);
          duplicates.push({ sport: duplicateObject.sport, year: duplicateObject.year, count: counts[key] });
        }
      }


      const finalData = {};

      for (const data of duplicates) {
        const { sport, year, count } = data;

        if (!finalData[sport]) {
          finalData[sport] = [];
        }


        finalData[sport].push({
          year: year,
          count: count
        });
      }


      const startYear = uniqueSportsYear[0],
        endYear = uniqueSportsYear[uniqueSportsYear.length - 1],
        btn = document.getElementById('play-pause-button'),
        input = document.getElementById('play-range');


      let chart;

      (function (H) {
        const FLOAT = /^-?\d+\.?\d*$/;

        // Add animated textSetter, just like fill/strokeSetters
        H.Fx.prototype.textSetter = function () {
          let startValue = this.start.replace(/ /g, ''),
            endValue = this.end.replace(/ /g, ''),
            currentValue = this.end.replace(/ /g, '');

          if ((startValue || '').match(FLOAT)) {
            startValue = parseInt(startValue, 10);
            endValue = parseInt(endValue, 10);

            // No support for float
            currentValue = Highcharts.numberFormat(
              Math.round(startValue + (endValue - startValue) * this.pos),
              0
            );
          }

          this.elem.endText = this.end;

          this.elem.attr(this.prop, currentValue, null, true);
        };

        // Add textGetter, not supported at all at this moment:
        H.SVGElement.prototype.textGetter = function () {
          const ct = this.text.element.textContent || '';
          return this.endText ? this.endText : ct.substring(0, ct.length / 2);
        };

        // Temporary change label.attr() with label.animate():
        // In core it's simple change attr(...) => animate(...) for text prop
        H.wrap(H.Series.prototype, 'drawDataLabels', function (proceed) {
          const attr = H.SVGElement.prototype.attr,
            chart = this.chart;

          if (chart.sequenceTimer) {
            this.points.forEach(point =>
              (point.dataLabels || []).forEach(
                label =>
                (label.attr = function (hash) {
                  if (
                    hash &&
                    hash.text !== undefined &&
                    chart.isResizing === 0
                  ) {
                    const text = hash.text;

                    delete hash.text;

                    return this
                      .attr(hash)
                      .animate({ text });
                  }
                  return attr.apply(this, arguments);

                })
              )
            );
          }

          const ret = proceed.apply(
            this,
            Array.prototype.slice.call(arguments, 1)
          );

          this.points.forEach(p =>
            (p.dataLabels || []).forEach(d => (d.attr = attr))
          );

          return ret;
        });
      }(Highcharts));








      function getData(year) {
        let arra = [];
        [finalData].forEach(val => {
          Object.entries(val).map((v) => {
            const [sportName, sportData] = v;
            const b = sportData.find((a) => a.year === year);
            arra.push([sportName, b?.count ? Number(b?.count) : 0]);
          })
        })

        // remove empty values
        // let finalFilter = [];
        // arra.forEach((val) => {
        //     if (val[1] !== 0) {
        //       finalFilter.push([val[0], Number(val[1])])
        //     }
        // })
        // return finalFilter;

        return arra;
      }



      function getSubtitle() {
        return `<span style="font-size: 80px">${input.value}</span>`;
      }

      (async () => {


        chart = Highcharts.chart('container', {
          chart: {
            animation: {
              duration: 3000
            },
            marginRight: 50
          },
          title: {
            text: 'Olympics',
            align: 'left'
          },
          subtitle: {
            useHTML: true,
            text: getSubtitle(),
            floating: true,
            align: 'right',
            verticalAlign: 'middle',
            y: -80,
            x: -100
          },

          legend: {
            enabled: false
          },
          xAxis: {
            type: 'category'
          },
          yAxis: {
            opposite: true,
            tickPixelInterval: 150,
            title: {
              text: null
            }
          },
          plotOptions: {
            series: {
              animation: false,
              groupPadding: 0,
              pointPadding: 0.1,
              borderWidth: 0,
              colorByPoint: true,
              dataSorting: {
                enabled: true,
                matchByName: true
              },
              type: 'bar',
              dataLabels: {
                enabled: true
              }
            }
          },
          series: [
            {
              type: 'bar',
              name: startYear,
              data: getData(startYear)
            }
          ],
          responsive: {
            rules: [{
              condition: {
                maxWidth: 550
              },
              chartOptions: {
                xAxis: {
                  visible: false
                },
                subtitle: {
                  x: 0
                },
                plotOptions: {
                  series: {
                    dataLabels: [{
                      enabled: true,
                      y: 8
                    }, {
                      enabled: true,
                      format: '{point.name}',
                      y: -8,
                      style: {
                        fontWeight: 'normal',
                        opacity: 0.7
                      }
                    }]
                  }
                }
              }
            }]
          }
        });
      })();

      function pause(button) {
        button.title = 'play';
        button.className = 'fa fa-play';
        clearTimeout(chart.sequenceTimer);
        chart.sequenceTimer = undefined;
      }

      function update(increment) {

        console.log(increment);
        if (increment) {
          input.value = parseInt(input.value, 10) + increment;
        }
        if (input.value >= endYear) {
          // Auto-pause
          pause(btn);
        }

        chart.update(
          {
            subtitle: {
              text: getSubtitle()
            }
          },
          false,
          false,
          false
        );

        chart.series[0].update({
          name: input.value,
          data: getData(uniqueSportsYear[increment])
        });

      }


      function play(button) {
        button.title = 'pause';
        button.className = 'fa fa-pause';
        let yearLen = uniqueSportsYear.length;
        let count = 0
        chart.sequenceTimer = setInterval(function () {
          if (yearLen === count) {
            clearTimeout(chart.sequenceTimer);
            chart.sequenceTimer = undefined;
          } else {
            count = count + 1
            update(count);
          }
        }, 3000);
      }


      btn.addEventListener('click', function () {
        if (chart.sequenceTimer) {
          pause(this);
        } else {
          play(this);
        }
      });


      input.addEventListener('click', function () {
        update(0);
      });

    });
}






