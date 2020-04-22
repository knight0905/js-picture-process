/**
 * 数据处理工具类
 */
class DataUtil {
	constructor() {}
}

/**
 * 数据缩放并插值 
 * @param w 目标矩阵宽度
 * @param h 目标矩阵高度
 * @param data 源数据矩阵（二维数组）
 * @param type 插值方式，1：双线性插值，2：三次内插法插值
 */
DataUtil.scaleData = function(w, h, data, type = 2) {
	let t1 = new Date().getTime();
	let dw = data[0].length;
	let dh = data.length;
	
	let resData = new Array(h);
	
	for (let j = 0; j < h; j++) {
		let line = new Array(w);
		for (let i = 0; i < w; i++) {
			let v;
			if (type === 2) {
				v = DataUtil.cubicInterpolation(w, h, i, j, data);
			} else if (type === 1) {
				v = DataUtil.interpolation(w, h, i, j, data);
			} else {
				throw new Error('scale data, type not supported(type must be 1 or 2)');
			}
			line[i] = Math.round(v);
		}
		resData[j] = line;
	}
	
	let t2 = new Date().getTime();
	console.log("数据插值耗时:", (t2 - t1));
	
	return resData;
}

/**
 * 双线性插值
 * @param sw 目标矩阵的宽度
 * @param sh 目标矩阵的高度
 * @param x_ 目标矩阵中的x坐标
 * @param y_ 目标矩阵中的y坐标
 * @param data 源数据矩阵（二维数组）
 */
DataUtil.interpolation = function(sw, sh, x_, y_, data) {
	let t1 = new Date().getTime();
	let w = data[0].length;
	let h = data.length;
	
	let x = (x_ + 0.5) * w / sw - 0.5;
	let y = (y_ + 0.5) * h / sh - 0.5;
	
	let x1 = Math.floor(x);
	let x2 = Math.floor(x + 0.5);
	let y1 = Math.floor(y);
	let y2 = Math.floor(y + 0.5);
	
	x1 = x1 < 0 ? 0 : x1;
	y1 = y1 < 0 ? 0 : y1;
	
	
	x1 = x1 < w - 1 ? x1 : w - 1;
	y1 = y1 < h - 1 ? y1 : h - 1;
	
	x2 = x2 < w - 1 ? x2 : w - 1;
	y2 = y2 < h - 1 ? y2 : h - 1;
	
	// 取出原矩阵中对应四个点的值
	let f11 = data[y1][x1];
	let f21 = data[y1][x2];
	let f12 = data[y2][x1];
	let f22 = data[y2][x2];
	// 计算该点的值
	let xm = x - x1;
	let ym = y - y1;
	let r1 = (1 - xm) * f11 + xm * f21;
	let r2 = (1 - xm) * f12 + xm * f22;
	let value = (1-ym) * r1 + ym * r2;
	
	return value;
}

/**
 * 三次内插法插值
 * @param sw 目标矩阵的宽度
 * @param sh 目标矩阵的高度
 * @param x_ 目标矩阵中的x坐标
 * @param y_ 目标矩阵中的y坐标
 * @param data 源数据矩阵（二维数组）
 */
DataUtil.cubicInterpolation = function (sw, sh, x_, y_, data) {
	let w = data[0].length;
	let h = data.length;
	// 计算缩放后坐标对应源数据上的坐标
	let x = x_ * w / sw;
	let y = y_ * h / sh;
	
	
	// 计算x和y方向的最近的4*4的坐标和权重
	let wcx = DataUtil.getCubicWeight(x);
	let wcy = DataUtil.getCubicWeight(y);
	
	//console.log("wcx", wcx);
	//console.log("wcy", wcy);
	
	// 权重
	let wx = wcx.weight;
	let wy = wcy.weight;
	
	// 坐标
	let xs = wcx.coordinate;
	let ys = wcy.coordinate;
	
	let val = 0;
	for (let j = 0; j < 4; j++) {
		let py = ys[j];
		py = py < 0 ? 0 : py;
		py = py > h - 1 ? h - 1 : py;
		for (let i = 0; i < 4; i++) {
			let px = xs[i];
			px = px < 0 ? 0 : px;
			px = px > w - 1 ? w - 1 : px;
			// 该点的值
			let dv = data[py][px];
			// 该点的权重
			let w_x = wx[i];
			let w_y = wy[j];
			// 根据加权加起来
			val += (dv * w_x * w_y);
		}
	}
	
	return val;
}

/**
 * 三次内插法插值中，基于BiCubic基函数，计算源坐标v，最近的4*4的坐标和坐标对应的权重
 * @param v 目标矩阵中坐标对应在源矩阵中坐标值
 */
DataUtil.getCubicWeight = function (v){
	let a = -0.5;
	
	// 取整
	let nv = Math.floor(v);
	
	// 坐标差值集合
	let xList = new Array(4);
	// 坐标集合
	let xs = new Array(4);
	
	// 最近的4个坐标差值
	xList[0] = nv - v - 1;
	xList[1] = nv - v
	xList[2] = nv - v + 1;
	xList[3] = nv - v + 2;
	// 
	xs[0] = nv - 1;
	xs[1] = nv;
	xs[2] = nv + 1;
	xs[3] = nv + 2;
	
	// 计算权重
	let ws = new Array(4);
	for (let i = 0; i < 4; i++) {
		let val = Math.abs(xList[i]);
		let w = 0;
		// 基于BiCubic基函数的双三次插值
		if (val <= 1) {
			w = (a + 2) * val * val * val - (a + 3) * val * val + 1;
		} else if (val < 2) {
			w = a * val * val * val - 5 * a * val * val + 8 * a * val - 4 * a;
		}
		ws[i] = w;
	}
	
	return {
		weight: ws,
		coordinate: xs
	};
}















