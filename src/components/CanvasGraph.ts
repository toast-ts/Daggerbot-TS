import {createCanvas, Canvas, CanvasRenderingContext2D} from 'canvas';
import {Config} from '../interfaces';
import ConfigHelper from '../helpers/ConfigHelper.js';
export default class CanvasBuilder {
  private canvas: Canvas;
  private ctx: CanvasRenderingContext2D;
  private config: Config;

  constructor() {
    this.canvas = createCanvas(1500, 750);
    this.ctx = this.canvas.getContext('2d');
    this.config = ConfigHelper.readConfig() as Config;
  }

  public async generateGraph(data:number[], type:'players'|'leaderboard'):Promise<Canvas> {
    // Color layout for the graph -- The variables are named exactly what it shows in graph to make it easier to be referenced to.
    let oddHorizontal = '#555B63';
    let evenHorizontal = '#3E4245';
    let background = '#111111';
    let textColor = '#FFFFFF';
    let redLine = '#E62C3B';
    let yellowLine = '#FFEA00';
    let greenLine = '#57F287';

    // Handle negative
    for (const [i, change] of data.entries()) if (change as number < 0) data[i] = data[i - 1] || data[i + 1] || 0;

    const LBdataFirst = Math.ceil(Math.max(...data) * 10 ** (-Math.max(...data).toString().split('').length + 1)) * 10 ** (Math.max(...data).toString().split('').length - 1)
    const LBdataSecond = Math.ceil(Math.max(...data) * 10 ** (-Math.max(...data).toString().split('').length + 2)) * 10 ** (Math.max(...data).toString().split('').length - 2)

    const firstTop = type === 'leaderboard' ? LBdataFirst : 16;
    const secondTop = type === 'leaderboard' ? LBdataSecond : 16;
    const textSize = 40;
    const origin = [15, 65];
    const size = [1300, 630];
    const nodeWidth = size[0] / (data.length - 1);
    this.ctx.fillStyle = background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Grey horizontal lines
    this.ctx.lineWidth = 5;

    const intervalCandidates:[number, number, number][] = [];
    for (let i = 4; i < 10; i++) {
      const interval = firstTop / i;
      if (Number.isInteger(interval)) intervalCandidates.push([interval, i, i * Math.max(interval.toString().split('').filter(x=>x === '0').length / interval.toString().length, 0.3) * (['1', '2', '4', '5', '6', '8'].includes(interval.toString()[0]) ? 1.5 : 0.67)]);
    }
    const chosenInterval = intervalCandidates.sort((a,b)=>b[2]-a[2])[0];
    let prevY:number[] = [];
    this.ctx.strokeStyle = oddHorizontal;

    if (type === 'leaderboard') for (let i = 0; i <= chosenInterval[1]; i++) {
      const y = origin[1] + size[1] - (i * (chosenInterval[0] / secondTop) * size[1]);
      if (y < origin[1]) continue;
      const even = ((i + 1) % 2) === 0;
      if (even) this.ctx.strokeStyle = evenHorizontal;
      this.ctx.beginPath();
      this.ctx.lineTo(origin[0], y);
      this.ctx.lineTo(origin[0] + size[0], y);
      this.ctx.stroke();
      this.ctx.closePath();
      if (even) this.ctx.strokeStyle = oddHorizontal;
      prevY = [y, i * chosenInterval[0]];
    }
    else for (let i = 0; i < data.length; i++) {
      const y = origin[1] + size[1] - (i * (chosenInterval[0] / secondTop) * size[1]);
      if (y < origin[1]) continue;
      const even = ((i + 1) % 2) === 0;
      if (even) this.ctx.strokeStyle = evenHorizontal;
      this.ctx.beginPath();
      this.ctx.lineTo(origin[0], y);
      this.ctx.lineTo(origin[0] + size[0], y);
      this.ctx.stroke();
      this.ctx.closePath();
      if (even) this.ctx.strokeStyle = oddHorizontal;
      prevY.push(y, i * chosenInterval[0]);
    }

    // 30 day/minute mark
    this.ctx.setLineDash([8, 16]);
    this.ctx.beginPath();
    const lastStart = origin[0] + (nodeWidth * (data.length - (type === 'players' ? 60 : 30)));
    this.ctx.lineTo(lastStart, origin[1]);
    this.ctx.lineTo(lastStart, origin[1] + size[1]);
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.setLineDash([]);

    // Draw points
    const isLeaderboard =()=>type === 'leaderboard' ? this.config.embedColor as string : null;
    this.ctx.strokeStyle = isLeaderboard();
    this.ctx.fillStyle = isLeaderboard();
    this.ctx.lineWidth = 5;

    const gradient = this.ctx.createLinearGradient(0, origin[1], 0, origin[1] + size[1]);
    gradient.addColorStop(1 / 16, redLine);
    gradient.addColorStop(5 / 16, yellowLine);
    gradient.addColorStop(12 / 16, greenLine);

    let lastCoordinates:number[] = [];
    for (let [i, currentValue] of data.entries()) {
      if (currentValue < 0) currentValue = 0;
      const X = i * nodeWidth + origin[0];
      const Y = ((1 - (currentValue / secondTop)) * size[1]) + origin[1];
      const nextValue = data[i + 1];
      const previousValue = data[i - 1];
      this.ctx.strokeStyle = type === 'players' ?  gradient : null;
      this.ctx.beginPath();

      if (lastCoordinates.length) this.ctx.moveTo(lastCoordinates[0], lastCoordinates[1]);
      // If the line being drawn is straight line, continue until it makes a slope.
      if (Y === lastCoordinates[1]) {
        let NewX = X;
        for (let j = i+1; j <= data.length; j++) {
          if (data[j] === currentValue) NewX += nodeWidth;
          else break;
        }
        this.ctx.lineTo(NewX, Y);
      } else this.ctx.lineTo(X, Y);
      lastCoordinates = [X, Y];
      this.ctx.stroke();
      this.ctx.closePath();

      if (currentValue !== previousValue || currentValue !== nextValue) {
        // Ball. What else?
        this.ctx.fillStyle = type === 'players' ? gradient : null;
        this.ctx.beginPath();
        this.ctx.arc(X, Y, this.ctx.lineWidth * 1.2, 0, 2 * Math.PI);
        this.ctx.closePath();
        this.ctx.fill();
      }
    }

    // Draw text
    this.ctx.font = '400 ' + textSize + 'px sans-serif';
    this.ctx.fillStyle = textColor;

    // Highest value
    this.ctx.fillText(type === 'leaderboard'
      ? prevY[1].toLocaleString('en-US')
      : prevY.at(-1).toLocaleString('en-US'), origin[0] + size[0] + textSize / 2, origin[1] + (textSize / 3)
    )

    // Lowest value
    this.ctx.fillText(type === 'leaderboard' ? '0 msgs' : '0', origin[0] + size[0] + textSize / 2, origin[1] + size[1] + (textSize / 3));

    // 30 day (minute for /mp players)
    this.ctx.fillText(type === 'leaderboard' ? '30 days ago' : '30 mins ago', lastStart, origin[1] - (textSize / 2));

    // Time
    this.ctx.fillText('time ->', origin[0] + (textSize / 2), origin[1] + size[1] + (textSize));

    return this.canvas;
  }
}
