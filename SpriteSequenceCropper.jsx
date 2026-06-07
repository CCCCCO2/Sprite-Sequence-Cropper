// ===================== 全局配置变量 =====================
var globalSettings=
{
    needCustomFirstFramePivotX: false,
    needCustomLastFramePivotX: false,
    customFirstFramePivotX : 0,
    customLastFramePivotX : 0,
    needAutoCrop: true,
    isBottomCenter : true,
    toleranceOfBottom : 5,
    faceLeft : true,
    needDrawGuideLine : true,
    needExportCSVFile : true,
    needHorizontalScaling: true,
    needVerticalScaling: false
};


// ===================== UI 界面 =====================
var win = new Window("dialog", "序列帧动画裁剪工具");
win.orientation = "column";

// 指定首帧锚点设置
var customFirstFrameSettingsGroup = win.add("panel", undefined, "指定首帧锚点设置");
var useCustomFirstFramePivotCheckbox = customFirstFrameSettingsGroup.add("checkbox", undefined, "启用指定首帧锚点");
useCustomFirstFramePivotCheckbox.helpTip = "启用后序列帧动画的第一帧裁剪将忽略\“自动裁剪\”或者\“手动框选选区裁剪\”，直接以指定的锚点为中心扩展裁剪选区。适用于需要衔接上一个动画的最后一帧，对齐位置的情况";
var inputCustomFirstFramePivotGroup = customFirstFrameSettingsGroup.add("group");
inputCustomFirstFramePivotGroup.add("statictext", undefined, "首帧中心锚点:");
var customFirstFramePivotXInputField = inputCustomFirstFramePivotGroup.add("edittext", [0, 0, 50, 20], globalSettings.customFirstFramePivotX);
customFirstFramePivotXInputField.helpTip = "要指定的中心锚点的横坐标值";

// 指定尾帧锚点设置
var customLastFrameSettingsGroup = win.add("panel", undefined, "指定尾帧锚点设置");
var useCustomLastFramePivotCheckbox = customLastFrameSettingsGroup.add("checkbox", undefined, "启用指定尾帧锚点");
useCustomLastFramePivotCheckbox.helpTip = "启用后序列帧动画的最后一帧裁剪将忽略\“自动裁剪\”或者\“手动框选选区裁剪\”，直接以指定的锚点为中心扩展裁剪选区。适用于需要衔接下一个动画的第一帧，对齐位置的情况";
var inputCustomLastFramePivotGroup = customLastFrameSettingsGroup.add("group");
inputCustomLastFramePivotGroup.add("statictext", undefined, "尾帧中心锚点:");
var customLastFramePivotXInputField = inputCustomLastFramePivotGroup.add("edittext", [0, 0, 50, 20], globalSettings.customLastFramePivotX);
customLastFramePivotXInputField.helpTip = "要指定的中心锚点的横坐标值";

var cropModePanel = win.add("panel", undefined, "裁剪模式");
cropModePanel.orientation = "row";
var autoCropRadio = cropModePanel.add("radiobutton", undefined, "自动裁剪");
var manualCropRadio = cropModePanel.add("radiobutton", undefined, "手动裁剪");
autoCropRadio.value = true;
autoCropRadio.helpTip = "自动裁剪方式将根据底部/顶部中心扩展指定范围，根据这个局部范围的中心作为该帧整张图片裁剪后的中心横坐标。该方式可适用于直立行走类生物的动作序列帧的裁剪";
manualCropRadio.helpTip = "手动裁剪方式必须对每帧（除了首尾帧且对应启用指定了锚点的帧）进行手动选区，该选区的中心点即为裁剪后图片的中心点";

// 自动裁剪设置
var autoCropSettingsGroup = win.add("panel", undefined, "自动裁剪设置");
var radioGroup = autoCropSettingsGroup.add("panel", undefined, "居中锚点方式");
radioGroup.orientation = "row";
var radio1= radioGroup.add("radiobutton", undefined, "底部中心");
var radio2 = radioGroup.add("radiobutton", undefined, "顶部中心");
radio1.value = true;
var toleranceGroup = autoCropSettingsGroup.add("group");
toleranceGroup.add("statictext", undefined, "底部/顶部 范围:");
var toleranceInputField = toleranceGroup.add("edittext", [0, 0, 20, 20], globalSettings.toleranceOfBottom);

// 手动框选选区裁剪设置
var manualCropSettingsGroup = win.add("panel", undefined, "手动裁剪设置");
var needHorizontalScalingCheckbox = manualCropSettingsGroup.add("checkbox", undefined, "水平方向扩展");
needHorizontalScalingCheckbox.value = true;
var needVerticalScalingCheckbox = manualCropSettingsGroup.add("checkbox", undefined, "垂直方向扩展");
needVerticalScalingCheckbox.value = true;

function RefreshCropModeUI()
{
    autoCropSettingsGroup.enabled = autoCropRadio.value;
    manualCropSettingsGroup.enabled = manualCropRadio.value;
}

RefreshCropModeUI();
autoCropRadio.onClick = RefreshCropModeUI;
manualCropRadio.onClick = RefreshCropModeUI;

// 写入csv
var csvExportSettingsGroup = win.add("panel", undefined, "CSV导出设置");
var needExportCSVFileCheckbox = csvExportSettingsGroup.add("checkbox", undefined, "启用导出CSV");
needExportCSVFileCheckbox.helpTip ="将图片裁剪后的中心锚点在原图尺寸中的坐标写入，并记录序列帧之间的中心点偏移，可以作为位移数据提供给后续使用。若无位移的序列帧动画则可以不导出 .csv 文件";
needExportCSVFileCheckbox.value = true;
var faceDirectionCheckBox = csvExportSettingsGroup.add("checkbox", undefined, "前进方向为左");
faceDirectionCheckBox.value = true;

// 其它可选项
var optionalSettingsGroup = win.add("panel", undefined, "其它可选项");
var needDrawGuideLineCheckbox = optionalSettingsGroup.add("checkbox", undefined, "绘制出参考线");
needDrawGuideLineCheckbox.value = true;
needDrawGuideLineCheckbox.helpTip = "是否绘制辅助参考线（仅在PS中作为视觉参考并不影响图片以及导出的任何数据）";

// 裁剪所有打开文档 Button
var cropAllOpenedDocumentButton = win.add("button", undefined, "裁剪所有打开文档");
cropAllOpenedDocumentButton.onClick = function() 
{
    if (!SyncParameters()) return;
    
    var docs = app.documents;
    var documentCount = docs.length;
    if (documentCount === 0) 
    {
        alert("没有打开任何文档，请先打开文档再进行裁剪");
        return;
    }

    var csvFile;
    if(globalSettings.needExportCSVFile)
    {
        // 打开或创建CSV文件
        var folder = Folder.selectDialog("选择导出文件夹");
        if (!folder) 
        {
            alert("未选择导出文件夹，取消裁剪");
            return;
        }
        csvFile = new File(folder.fsName + "/offsets.csv");
        var fileExists = csvFile.exists;
        csvFile.open("a");  // 追加打开文件，如果不存在则自动创建
        if (!fileExists) 
        {
            csvFile.writeln("文件名,中心点X,中心点Y,偏移量X,偏移量Y");
        }
    }

    // 遍历所有文档进行处理
    var preCenter = null;
    for (var i = 0; i < documentCount; i++)
    {
        var doc = docs[i];
        app.activeDocument = doc;
        
        var isFirstDocument = (i == 0);
        var isLastDocument = (i > 0  && i == documentCount - 1);

        if (globalSettings.needCustomFirstFramePivotX && isFirstDocument)
        {
            // 首帧特殊处理
            preCenter = CropByFixedPivot(doc, globalSettings.customFirstFramePivotX, globalSettings.needExportCSVFile, csvFile, preCenter, globalSettings.faceLeft, globalSettings.needDrawGuideLine);
        }
        else if (globalSettings.needCustomLastFramePivotX && isLastDocument)
        {
            // 尾帧特殊处理
            preCenter = CropByFixedPivot(doc, globalSettings.customLastFramePivotX, globalSettings.needExportCSVFile, csvFile, preCenter, globalSettings.faceLeft, globalSettings.needDrawGuideLine);
        }
        else
        {
            // 中间帧处理
            if(globalSettings.needAutoCrop)
            {
                // 自动裁剪
                preCenter = BipedAutoCropCurrentDocument(doc, globalSettings.isBottomCenter, globalSettings.toleranceOfBottom, globalSettings.needExportCSVFile, csvFile, preCenter, globalSettings.faceLeft, globalSettings.needDrawGuideLine);
            }
            else
            {
                // 手动框选选区裁剪
                try{
                    var bounds = doc.selection.bounds;
                }
                catch (e) {
                    alert("未启用自动裁剪，需要手动框选所有帧的选区。但文档 " + doc.name + " 的选区不存在，请先手动框选选区");
                    return;
                }
                preCenter = ManualCropCurrentDocument(doc, globalSettings.needHorizontalScaling, globalSettings.needVerticalScaling, globalSettings.needExportCSVFile, csvFile, preCenter, globalSettings.faceLeft, globalSettings.needDrawGuideLine);
            }
        }
    }
    // 写入结束，关闭文件
    if (csvFile) 
        csvFile.close();

}

// 保存所有打开文档 Button
var saveAllOpenedDocumentButton = win.add("button", undefined, "保存所有打开文档（覆盖）");
saveAllOpenedDocumentButton.onClick = function() 
{
    if (app.documents.length === 0) 
    {
        alert("没有打开任何文档，无需保存");
        return;
    }
    
    if (!confirm("确定要覆盖保存所有文档吗？")) return;
    var docs = app.documents;
    // 遍历每一个文档
    for (var i = 0; i < docs.length; i++) 
    {
        var doc = docs[i]; // 当前文档
        // 激活当前文档
        app.activeDocument = doc;
        SaveDocument(doc);
    }
};


// ===================== 通用UI =====================

// 关闭 Button
var closeButton = win.add("button", undefined, "关闭");
closeButton.onClick = function() {
    win.close();
};

win.show();

// ===================== 工具函数 =====================

// 同步参数
function SyncParameters()
{
    globalSettings.needCustomFirstFramePivotX= useCustomFirstFramePivotCheckbox.value;
    if(useCustomFirstFramePivotCheckbox.value)
    {
        var integerInput = parseInt(customFirstFramePivotXInputField.text, 10);
        if (!isNaN(integerInput) && integerInput>=0 ) {
            globalSettings.customFirstFramePivotX = integerInput;
        } 
        else {
            alert("首帧锚点中心请输入有效的非负数值");
            return false;
        }
    }
    globalSettings.needCustomLastFramePivotX= useCustomLastFramePivotCheckbox.value;
    if(useCustomLastFramePivotCheckbox.value)
    {
        var integerInput = parseInt(customLastFramePivotXInputField.text, 10);
        if (!isNaN(integerInput) && integerInput>=0 ) {
            globalSettings.customLastFramePivotX = integerInput;
        } 
        else {
            alert("尾帧锚点中心请输入有效的非负数值");
            return false;
        }
    }
    
    globalSettings.needAutoCrop = autoCropRadio.value;
    globalSettings.isBottomCenter = radio1.value;
    if(autoCropRadio.value)
    {
        var integerInput = parseInt(toleranceInputField.text, 10);
        if (!isNaN(integerInput) && integerInput>=0 ) {
            globalSettings.toleranceOfBottom = integerInput;
        } 
        else {
            alert("底部/顶部范围请输入有效的非负数值");
            return false;
        }
    }

    globalSettings.faceLeft = faceDirectionCheckBox.value;
    globalSettings.needDrawGuideLine = needDrawGuideLineCheckbox.value;
    globalSettings.needExportCSVFile = needExportCSVFileCheckbox.value;
    globalSettings.needHorizontalScaling = needHorizontalScalingCheckbox.value;
    globalSettings.needVerticalScaling = needVerticalScalingCheckbox.value;
    
    return true;
}

// 获取选取中心点
function CenterOfBound(bound) 
{
    return {
        x: (bound[0].value + bound[2].value) * 0.5,
        y: (bound[1].value + bound[3].value) * 0.5
    };
}

// ===================== 核心功能 =====================

// 手动选区裁剪当前文档
function ManualCropCurrentDocument(doc, needHorizontalScaling, needVerticalScaling, needExportCSVFile, csvFile, preCenter, faceLeft, needDrawGuideLine) 
{
    // 获取选区
    var manualBounds = doc.selection.bounds;
    var leftBound = manualBounds[0].value;
    var topBound = manualBounds[1].value;
    var rightBound = manualBounds[2].value;
    var bottomBound = manualBounds[3].value;
    
     // 获取当前文档宽度和高度
    var docWidth = doc.width;
    var docHeight = doc.height;

    // 当前图层的边界最大位置
    var currentLayer = doc.activeLayer;
    var currentLayerBounds = currentLayer.bounds;
    var currentLayerLeft = currentLayerBounds[0].value;
    var currentLayerRight = currentLayerBounds[2].value;
    var currentLayerTop = currentLayerBounds[1].value;
    var currentLayerBottom = currentLayerBounds[3].value;
    var currentLayerLeftMinPosition = Math.max(0, currentLayerLeft);
    var currentLayerRightMaxPosition = Math.min(docWidth, currentLayerRight);
    var currentLayerTopMinPositon = Math.max(0, currentLayerTop);
    var currentLayerBottomMaxPosition = Math.min(docHeight, currentLayerBottom);
    
    // 中心点
    var center = CenterOfBound(manualBounds);
    
    if(needDrawGuideLine)
    {
        // 添加最大边界位置的参考线
        var guideLeftMincrop = doc.guides.add(Direction.VERTICAL, new UnitValue(currentLayerLeftMinPosition, "px"));  // 添加最左侧参考线
        var guideRightMaxcrop = doc.guides.add(Direction.VERTICAL, new UnitValue(currentLayerRightMaxPosition, "px")); // 添加最右侧参考线
        var guideTopMincrop = doc.guides.add(Direction.HORIZONTAL, new UnitValue(currentLayerTopMinPositon, "px")); // 添加最上方参考线
        var guideBottomMaxcrop = doc.guides.add(Direction.HORIZONTAL, new UnitValue(currentLayerBottomMaxPosition, "px"));    // 添加最下方参考线
        // 中心点位置参考线
        var guidePivotV = doc.guides.add(Direction.VERTICAL, new UnitValue(center.x, "px"));
        var guidePivotH = doc.guides.add(Direction.HORIZONTAL, new UnitValue(center.y, "px"));
    }

     // 定义最终的裁剪区域
    var cropRegion; 
    var cropAngle = 0
    var finalCropLeftPosition;
    var finalCropRightPosition;
    var finalCropToptPosition;
    var finalCropBottomPosition;
    
    // 是否水平方向扩展
    if(needHorizontalScaling)
    {
        var leftDifference= Math.abs(leftBound - currentLayerLeftMinPosition);
        var rightDifference = Math.abs(currentLayerRightMaxPosition- rightBound)
        if(leftDifference > rightDifference)
        {
            finalCropLeftPosition = currentLayerLeftMinPosition;
            finalCropRightPosition = rightBound + leftDifference;
        }
        else
        {
            finalCropLeftPosition = leftBound - rightDifference;
            finalCropRightPosition = currentLayerRightMaxPosition;
        }
    }
    else
    {
        finalCropLeftPosition = currentLayerLeftMinPosition;
        finalCropRightPosition = currentLayerRightMaxPosition;
    }
    
    // 是否垂直方向扩展
    if(needVerticalScaling)
    {
        var topDifference= Math.abs(currentLayerTopMinPositon - topBound);
        var bottomDifference = Math.abs(bottomBound - currentLayerBottomMaxPosition)
        if(topDifference > bottomDifference)
        {
            finalCropToptPosition = currentLayerTopMinPositon;
            finalCropBottomPosition = bottomBound + topDifference;
        }
        else
        {
            finalCropToptPosition = topBound + bottomDifference;
            finalCropBottomPosition = currentLayerBottomMaxPosition;
        }
    }
    else
    {
        finalCropToptPosition = currentLayerTopMinPositon;
        finalCropBottomPosition = currentLayerBottomMaxPosition;
    }

    // 写入.csv文件
    var offsetX, offsetY;
    if(preCenter==null) 
    {
        offsetX = 0; 
        offsetY = 0;
    }
    else
    {
        offsetX = center.x - preCenter.x;
        offsetY = center.y - preCenter.y;
    }
    // 根据角色的左右朝向，决定偏移值的正负，保证偏移值的正始终代表着角色的“正面”前进方向，负代表角色的“背后”后退方向
    if(faceLeft)
    {
        offsetX = -offsetX;
        offsetY = -offsetY;
    }
    if(needExportCSVFile)
    {
        csvFile.writeln(doc.name + "," + center.x + "," + center.y + "," + offsetX + "," + offsetY);
    }

    cropRegion = [finalCropLeftPosition, finalCropToptPosition, finalCropRightPosition, finalCropBottomPosition];
    // 设置裁剪区域
    doc.crop(cropRegion, cropAngle);
    return center;
}

// 自动裁剪当前文档（直立类生物）
function BipedAutoCropCurrentDocument(doc, isBottomCenter, toleranceOfBottom, needExportCSVFile, csvFile, preCenter, faceLeft, needDrawGuideLine) 
{
    // 获取当前文档宽度和高度
    var docWidth = doc.width;
    var docHeight = doc.height;

    // 获取当前图层
    var currentLayer = doc.activeLayer;

    // 图层的边界最大位置
    var currentLayerBounds = currentLayer.bounds;
    var currentLayerLeft = currentLayerBounds[0].value;
    var currentLayerRight = currentLayerBounds[2].value;
    var currentLayerTop = currentLayerBounds[1].value;
    var currentLayerBottom = currentLayerBounds[3].value;
    var currentLayerLeftMinPosition = Math.max(0, currentLayerLeft);
    var currentLayerRightMaxPosition = Math.min(docWidth, currentLayerRight);
    var currentLayerTopMinPositon = Math.max(0, currentLayerTop);
    var currentLayerBottomMaxPosition = Math.min(docHeight, currentLayerBottom);

    // 添加最大边界位置的参考线
    if(needDrawGuideLine)
    {
        var guideLeftMincrop = doc.guides.add(Direction.VERTICAL, new UnitValue(currentLayerLeftMinPosition, "px"));  // 添加最左侧参考线
        var guideRightMaxcrop = doc.guides.add(Direction.VERTICAL, new UnitValue(currentLayerRightMaxPosition, "px")); // 添加最右侧参考线
        var guideTopMincrop = doc.guides.add(Direction.HORIZONTAL, new UnitValue(currentLayerTopMinPositon, "px")); // 添加最上方参考线
        var guideBottomMaxcrop = doc.guides.add(Direction.HORIZONTAL, new UnitValue(currentLayerBottomMaxPosition, "px"));    // 添加最下方参考线
    }

    // 复制图层重新获取一个区域范围的边界
    var duplLayer = currentLayer.duplicate();
    doc.activeLayer = duplLayer;
    var tempLayer = doc.activeLayer;
    
    // 根据锚点居中方式以及底部/顶部 容忍度获取选区
    var selectionRegion;
    if(isBottomCenter)
    {
        selectionRegion= [
            [0, 0],
            [docWidth, 0], 
            [docWidth, docHeight - toleranceOfBottom],
            [0, docHeight - toleranceOfBottom]
        ];
    }
    else
    {
        selectionRegion= [
            [0, docHeight - toleranceOfBottom],
            [docWidth, docHeight - toleranceOfBottom], 
            [0, docHeight],
            [docWidth, docHeight]
        ];
    }
    var type = SelectionType.REPLACE;
    var feather = 0;    // 羽化值
    var antiAlias = false;  // 是否抗锯齿
    doc.selection.select(selectionRegion, type, feather, antiAlias); // 创建矩形选区
    doc.selection.clear();
    doc.selection.deselect();

    var leftBound = doc.activeLayer.bounds[0].value;
    var topBound = doc.activeLayer.bounds[1].value;
    var rightBound = doc.activeLayer.bounds[2].value;
    var bottomBound = doc.activeLayer.bounds[3].value;

    if(needDrawGuideLine)
    {
        var guideLeftBottomcrop = doc.guides.add(Direction.VERTICAL, new UnitValue(leftBound, "px"));
        var guideRightBottomcrop =doc.guides.add(Direction.VERTICAL, new UnitValue(rightBound, "px"));
    }

    try {
        tempLayer.remove();
    } catch (e) {
        alert("无法删除图层: " + e.message + "\n" + e.stack);
        return;
    }

     // 定义裁剪区域
    var cropRegion; 
    var cropAngle = 0
    var finalCropLeftPosition;
    var finalCropRightPosition;
    var finalCropToptPosition;
    var finalCropBottomPosition;
    
    var leftDifference= Math.abs(leftBound - currentLayerLeftMinPosition);
    var rightDifference = Math.abs(currentLayerRightMaxPosition- rightBound)
    
    // 计算最终的裁剪区域位置
    if(leftDifference > rightDifference)
    {
        finalCropLeftPosition = currentLayerLeftMinPosition;
        finalCropRightPosition = rightBound + leftDifference;
    }
    else
    {
        finalCropLeftPosition = leftBound - rightDifference;
        finalCropRightPosition = currentLayerRightMaxPosition;
    }
    finalCropToptPosition = currentLayerTopMinPositon;
    finalCropBottomPosition = currentLayerBottomMaxPosition;

    cropRegion = [finalCropLeftPosition, finalCropToptPosition, finalCropRightPosition, finalCropBottomPosition];

    var center =  {x: (finalCropLeftPosition + finalCropRightPosition) * 0.5, y: (finalCropToptPosition + finalCropBottomPosition) * 0.5};
    var offsetX, offsetY;
    if(preCenter==null)
    {
        offsetX = 0;
        offsetY = 0;
    } 
    else
    {
        offsetX = center.x - preCenter.x;
        offsetY = center.y - preCenter.y;
    }
    // 根据角色的左右朝向，决定偏移值的正负，保证偏移值的正始终代表着角色的“正面”前进方向，负代表角色的“背后”后退方向
    if(faceLeft)
    {
        offsetX = -offsetX;
        offsetY = -offsetY;
    }
    if(needExportCSVFile)
    {
        csvFile.writeln(doc.name + "," + center.x  + "," + center.y + "," + offsetX + "," + offsetY);
    }
    
    // 设置裁剪区域
    doc.crop(cropRegion, cropAngle);
    return center;
}

// 已知中心锚点，裁剪当前文档
function CropByFixedPivot(doc, pivotX, needExportCSVFile, csvFile, preCenter, faceLeft, needDrawGuideLine)
{
    // 获取当前文档宽度和高度
    var docWidth = doc.width;
    var docHeight = doc.height;

    // 获取当前图层
    var currentLayer = doc.activeLayer;

    // 图层的边界最大位置
    var currentLayerBounds = currentLayer.bounds;
    var currentLayerLeft = currentLayerBounds[0].value;
    var currentLayerRight = currentLayerBounds[2].value;
    var currentLayerTop = currentLayerBounds[1].value;
    var currentLayerBottom = currentLayerBounds[3].value;
    var currentLayerLeftMinPosition = Math.max(0, currentLayerLeft);
    var currentLayerRightMaxPosition = Math.min(docWidth, currentLayerRight);
    var currentLayerTopMinPositon = Math.max(0, currentLayerTop);
    var currentLayerBottomMaxPosition = Math.min(docHeight, currentLayerBottom);

    // 添加最大边界位置的参考线
    if(needDrawGuideLine)
    {
        var guideLeftMincrop = doc.guides.add(Direction.VERTICAL, new UnitValue(currentLayerLeftMinPosition, "px"));  // 添加最左侧参考线
        var guideRightMaxcrop = doc.guides.add(Direction.VERTICAL, new UnitValue(currentLayerRightMaxPosition, "px")); // 添加最右侧参考线
        var guideTopMincrop = doc.guides.add(Direction.HORIZONTAL, new UnitValue(currentLayerTopMinPositon, "px")); // 添加最上方参考线
        var guideBottomMaxcrop = doc.guides.add(Direction.HORIZONTAL, new UnitValue(currentLayerBottomMaxPosition, "px"));    // 添加最下方参考线
    }

    var leftDistance = Math.abs(pivotX - currentLayerLeftMinPosition);
    var rightDistance = Math.abs(currentLayerRightMaxPosition - pivotX);
    var halfWidth = Math.max(leftDistance, rightDistance);
    var cropLeft = pivotX - halfWidth;
    var cropRight = pivotX + halfWidth;
    var cropTop = currentLayerTopMinPositon;
    var cropBottom = currentLayerBottomMaxPosition;

    // 记录中心点和偏移写入.csv文件
    var center =  {x: pivotX, y: (cropTop + cropBottom) * 0.5};
    var offsetX, offsetY;
    if(preCenter==null) 
    {
        offsetX = 0; 
        offsetY = 0;
    }
    else
    {
        offsetX = center.x - preCenter.x;
        offsetY = center.y - preCenter.y;
    }
    // 根据角色的左右朝向，决定偏移值的正负，保证偏移值的正始终代表着角色的“正面”前进方向，负代表角色的“背后”后退方向
    if(faceLeft)
    {
        offsetX = -offsetX;
        offsetY = -offsetY;
    }
    if(needExportCSVFile)
    {
        csvFile.writeln(doc.name + "," + center.x + "," + center.y + "," + offsetX + "," + offsetY);
    }

    doc.crop([cropLeft, cropTop, cropRight, cropBottom], 0);
    return center;
}

// 保存文档
function SaveDocument(doc)
{
    try
    {
        doc.save();
    } 
    catch (e) 
    {
        alert("保存文档失败: " + e.message);
    }
}