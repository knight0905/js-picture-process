# js-picture-process
**用于绘制场图（气象中湿度场或者温度场等），和等值线，如温度的等值线，同时实现了图像或者数据的缩放，等值线的查找方法等**
1. 用js实现图像或数据缩放插值方法，实现了“图像双线性插值法”和“三次卷积内插法”(三次内插法)
2. 基于Marching squares算法，进行等值线的提取
3. 在canvas中生成数据的场图（类似热力图）、等值线

![生成图片](https://raw.githubusercontent.com/knight0905/js-picture-process/master/img/hum.png)
