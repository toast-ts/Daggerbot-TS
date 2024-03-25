import {createCanvas, Canvas, SKRSContext2D} from '@napi-rs/canvas';
import {Config} from 'src/interfaces';
import ConfigHelper from '../helpers/ConfigHelper.js';
export default class CanvasBuilder {
  private static readonly canvas: Canvas = createCanvas(1500, 750);
  private static readonly ctx: SKRSContext2D = this.canvas.getContext('2d');
  private static readonly config: Config = ConfigHelper.readConfig();
  private static readonly palette = {
    // Color palette for the graph -- The variables are named exactly what it shows in graph to make it easier to be referenced to.
    oddHorizontal: '#555B63',
    evenHorizontal: '#3E4245',
    background: '#111111',
    textColor: '#FFFFFF',
    redLine: '#E62C3B',
    yellowLine: '#FFEA00',
    greenLine: '#57F287'
  };

  public static async generateGraph(data:number[], type:'players'|'leaderboard'):Promise<Canvas> {
    // Handle negative
    for (const [i, change] of data.entries()) if (change < 0) data[i] = data[i - 1] || data[i + 1] || 0;

    const LB_MAX_VAL = Math.max(...data);
    const LB_SCALE_UP = Math.pow(10, -Math.floor(Math.log10(LB_MAX_VAL)));
    const LB_SCALED_DATA = Math.ceil(LB_MAX_VAL*LB_SCALE_UP) / LB_SCALE_UP;

    const top = type === 'leaderboard' ? LB_SCALED_DATA : 16;
    const textSize = 40;
    const origin = [15, 65];
    const size = [1300, 630];
    const nodeWidth = size[0] / (data.length - 1);
    this.ctx.globalAlpha = 0;
    this.ctx.fillStyle = this.palette.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.globalAlpha = 1;

    // Grey horizontal lines
    this.ctx.lineWidth = 5;

    const intervalCandidates:[number, number, number][] = [];
    for (let i = 4; i < 10; i++) {
      const interval = top / i;
      if (Number.isInteger(interval)) intervalCandidates.push([interval, i, i * Math.max(interval.toString().split('').filter(x=>x === '0').length / interval.toString().length, 0.3) * (['1', '2', '4', '5', '6', '8'].includes(interval.toString()[0]) ? 1.5 : 0.67)]);
    }
    const chosenInterval = intervalCandidates.sort((a,b)=>b[2]-a[2])[0];
    let prevY:number[] = [];
    this.ctx.strokeStyle = this.palette.oddHorizontal;

    for (let i = 0; i <= chosenInterval[1]; i++) {
      const y = origin[1] + size[1] - (i * (chosenInterval[0] / top) * size[1]);
      if (y < origin[1]) continue;
      const even = ((i + 1) % 2) === 0;
      if (even) this.ctx.strokeStyle = this.palette.evenHorizontal;
      this.ctx.beginPath();
      this.ctx.lineTo(origin[0], y);
      this.ctx.lineTo(origin[0] + size[0], y);
      this.ctx.stroke();
      this.ctx.closePath();
      if (even) this.ctx.strokeStyle = this.palette.oddHorizontal;
      prevY.push(y, i * chosenInterval[0]); // It didn't seem to take effect when I tested on leaderboard, so using push instead for both players and leaderboard.
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
    this.ctx.strokeStyle = type === 'leaderboard' ? this.config.embedColor as string : null;
    this.ctx.fillStyle = type === 'leaderboard' ? this.config.embedColor as string : null;
    this.ctx.lineWidth = 5;

    const gradient = this.ctx.createLinearGradient(0, origin[1], 0, origin[1] + size[1]);
    gradient.addColorStop(1 / 16, this.palette.redLine);
    gradient.addColorStop(5 / 16, this.palette.yellowLine);
    gradient.addColorStop(12 / 16, this.palette.greenLine);

    let lastCoordinates:number[] = [];
    for (let [i, currentValue] of data.entries()) {
      if (currentValue < 0) currentValue = 0;
      const X = i * nodeWidth + origin[0];
      const Y = ((1 - (currentValue / top)) * size[1]) + origin[1];
      const nextValue = data[i + 1];
      const previousValue = data[i - 1];
      this.ctx.strokeStyle = type === 'players' ? gradient : null;
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
        // Balls. What else? I mean.. I'm not that creative, I'm just a comment not a funny comedian.
        this.ctx.fillStyle = type === 'players' ? gradient : null;
        this.ctx.beginPath();
        this.ctx.arc(X, Y, this.ctx.lineWidth * 0.8, 1, 2 * Math.PI);
        this.ctx.closePath();
        this.ctx.fill();
      }
    }

    // Draw text
    this.ctx.font = `400 ${textSize}px DejaVu Sans`;
    this.ctx.fillStyle = this.palette.textColor;

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

    // 100degree the fuck back to sender.
    return this.canvas;
  }
}
