/*
 * 查找等值线时，四个相邻数据点之间和等值线的关系拓扑
 * 每个key转换为2进制，最后四位，即对应四个点值比轮廓值大(1)还是小(0)的关系
 */
let ps = {
	0: [],
	4: [
		[[0, 0.5], [0.5, 1]]
	],
	2: [
		[[0.5, 1], [1, 0.5]]
	],
	6: [
		[[0, 0.5], [1, 0.5]]
	],
	1: [
		[[0.5, 0], [1, 0.5]]
	],
	5: [
		[[0, 0.5], [0.5, 0]],
		[[0.5, 1], [1, 0.5]]
	],
	3: [
		[[0.5, 0], [0.5, 1]]
	],
	7: [
		[[0, 0.5], [0.5, 0]]
	],
	8: [
		[[0, 0.5], [0.5, 0]]
	],
	12: [
		[[0.5, 0], [0.5, 1]]
	],
	10: [
		[[0.5, 0], [1, 0.5]],
		[[0, 0.5], [0.5, 1]]
	],
	14: [
		[[0.5, 0], [1, 0.5]]
	],
	9: [
		[[0, 0.5], [1, 0.5]]
	],
	13: [
		[[0.5, 1], [1, 0.5]]
	],
	11: [
		[[0, 0.5], [0.5, 1]]
	],
	15: []
};

/**
 * 画图工具类
 */
class DrawUtil {
	constructor() {}
}

/**
 * 绘制场图
 * @param data 数据二维数组，绘制的像素大小，为矩阵的长和宽
 * @param ctx canvas画笔
 * @param valueToColorFnc 数组中值转换为对应颜色的方法，该方法参数为 数据的值，返回一个颜色值(#ffffff/#fff/rgb(1,1,1)/rgba(1,1,1,255))
 */
DrawUtil.drawFieldMap = function(data, ctx, valueToColorFnc) {
	let h = data.length;
	let w = data[0].length;
	
	var imgData=ctx.getImageData(0,0,w,h);
	let rgbs = imgData.data;
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			let index = (y * w + x) * 4;
			
			// 计算像素点对于在数据中的点的插值
			let _x = x / w;
			let _y = y / h;
			let v = data[y][x];//Interpolation(_x, _y, data);
			
			let rgba = DrawUtil.colorToRgba(valueToColorFnc(v));
			
			rgbs[index] = rgba[0];
			rgbs[index + 1] = rgba[1];
			rgbs[index + 2] = rgba[2];
			rgbs[index + 3] = rgba[3];
		}
	}
	ctx.putImageData(imgData,0,0);
	
	return ctx;
}

/**
 * 颜色转换为rgba的集合
 * @param color 颜色支持#ffffff/#fff/rgb(1,1,1)/rgba(1,1,1,255)
 * 
 * @return rgba int数组 [r, g, b, a]
 */
DrawUtil.colorToRgba = function(color) {
	let rgba = new Array(4);
	
	if (color.startsWith("#")) {
		if (color.length === 7) {
			rgba[0] = parseInt(color.substr(1, 2), 16);
			rgba[1] = parseInt(color.substr(3, 2), 16);
			rgba[2] = parseInt(color.substr(5, 2), 16);
			rgba[3] = 255;
		} else if (color.length === 4) {
			rgba[0] = parseInt(color.substr(1, 1), 16);
			rgba[1] = parseInt(color.substr(2, 1), 16);
			rgba[2] = parseInt(color.substr(3, 1), 16);
			rgba[3] = 255;
		} else {
			throw new Error("color to rgba, wrong color");
		}
	} else if (color.startsWith("rgb")) {
		let list = color.substring(color.indexOf("(") + 1, color.indexOf(")")).split(",");
		rgba[0] = parseInt(list[0].trim());
		rgba[1] = parseInt(list[1].trim());
		rgba[2] = parseInt(list[2].trim());
		rgba[3] = color.startsWith("rgba") && list[3] ? parseInt(list[3].trim()) : 255;
	} else {
		throw new Error("error color string");
	}
	
	return rgba;
}

/**
 * 绘制等值线 
 * @param data 数据矩阵
 * @param ctx canvas画笔
 * @param nums 值（等值线的值）
 * @param colors 等值线颜色的集合
 * @param drawNum 是否在等值线上绘制数值
 */
DrawUtil.contourLine = function(data, ctx, nums = [], colors = ["#000"], drawNum = true) {
	if (!data || data.length === 0) {
		throw new Error("line, data is empty");
	}
	let lineInfos = DrawUtil.getLineDatas(data, nums, colors);
	let h = data.length;
	let w = data[0].length;
	DrawUtil.lineCanvas(w, h, lineInfos, ctx, drawNum);
};

/**
 * 获取等值线数据
 * @param data 数据矩阵
 * @param nums 等值线值的集合
 * @param colors 每个等值线值对应的颜色
 * 
 * @return lineInfos 等值线点数据、值、颜色的集合[{color: "#fff", num: 10, lines: [{x: 1, y: 1, lines: []}]}]
 */
DrawUtil.getLineDatas = function(data, nums, colors = ["#000"]) {
	let t1 = new Date().getTime();
	let h = data.length;
	let w = data[0].length;
	
	let lineInfos = {};
	for (let i = 0; i < nums.length; i++) {
		lineInfos[nums[i]] = {
			color: colors[i < colors.length - 1 ? i : colors.length - 1],
			num: nums[i],
			lines: []
		};
	}
	
	let numLen = nums.length;
	
	for (let y = 0, hs = h - 1; y < hs; y++) {
		for (let x = 0, ws = w - 1; x < ws; x++) {
			// 周围四个点
			let d1 = data[y][x];
			let d2 = data[y + 1][x];
			let d3 = data[y + 1][x + 1];
			let d4 = data[y][x + 1];
			for (let i = 0; i < numLen; i++) {
				let num = nums[i];
				let ls = lineInfos[num].lines;
				
				let t = 0;
				t = d1 < num ? t : 1;
				t = d2 < num ? t : 1 << 1 | t;
				t = d3 < num ? t : 1 << 2 | t;
				t = d4 < num ? t : 1 << 3 | t;
				ls.push({
					x: x,
					y: y,
					lines: ps[t]
				});
			}
		}
	}
	
	let t2 = new Date().getTime();
	console.log("提取等值线耗时:", (t2 - t1));
	
	return lineInfos;
}

/**
 * 绘制等值线
 * @param w canvas宽度
 * @param h canvas高度
 * @param lineInfos 等值线点数据、值、颜色的集合
 * @param ctx 画笔 canvas.getContext('2d')
 */
DrawUtil.lineCanvas = function(w, h, lineInfos, ctx, drawNum = true) {
	let t1 = new Date().getTime();
	
    ctx.font = "16px bold 黑体";
	// 设置水平对齐方式
	ctx.textAlign = "center"
	// 设置垂直对齐方式
	ctx.textBaseline = "middle";
	// 设置颜色
	ctx.fillStyle = "#000000";
	
	for (let key in lineInfos){
		let li = lineInfos[key];
		let ls = li.lines;
		
		let num = li.num;
		
		ctx.lineWidth = num === 0 ? 2 : 1.5;
		ctx.strokeStyle = li.color;
		ctx.beginPath();
		
		let ex;
		let ey;
		
		let lenx = ls.length;
		let leny;
		for (let i = 0; i < lenx; i++) {
			let x = ls[i].x;
			let y = ls[i].y;
			leny = ls[i].lines.length;
			for (let j = 0; j < leny; j++) {
				let points = ls[i].lines[j];
				let x1 = x + points[0][0];
				let y1 = y + points[0][1];
				
				let x2 = x + points[1][0];
				let y2 = y + points[1][1];
				
				ctx.moveTo(x1, y1);
				ctx.lineTo(x2, y2);
				
				ex = x1;
				ey = y1;
			}
		}
		ctx.stroke();
		
		let nx = ex;
		let ny = ey;
		
		if (drawNum) {
			if (nx > (w - 30)) {
				nx = w - 30;
			} else if (nx < 30) {
				nx = 30;
			}
			
			if (ny > (h - 20)) {
				ny = h - 20;
			} else if (ny < 6) {
				ny = 6;
			}
			
			ctx.moveTo(0, 0);
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(nx - 15, ny - 10, 30, 20);
			
			ctx.fillStyle = li.color;
			// 绘制文字（参数：要写的字，x坐标，y坐标）
			ctx.fillText(num, nx, ny);
		}
	}
	
	let t2 = new Date().getTime();
	console.log("画线耗时:", (t2 - t1));
}

