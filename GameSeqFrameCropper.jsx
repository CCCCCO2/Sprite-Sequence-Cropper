// ===================== 全局配置变量 =====================
var globalSettings=
{};

var bipedAutoCropSettings=
{
    needCropTop : true,
    needCropBottom : true,
    needDrawGuideLine : true,
    toleranceOfBottom : 5,
    isBottomCenter : true,
    faceLeft : true
};

var manualCropSettings=
{
    needDrawGuideLine : true,
    needExportCSVFile : true,
    needHorizontalScaling: true,
    needVerticalScaling: false,
    faceLeft : true
};

var fixedCenterCropSettings=
{
    pivotX : 0,
    needCropTop : true,
    needCropBottom : true,
    needDrawGuideLine : true,
};


// ===================== UI 界面 =====================
var win = new Window("dialog", "使锚点居中的裁剪");
win.orientation = "column";
// 下拉菜单
var whichInfo = win.add("dropdownlist");
whichInfo.alignment = "left";
var allGroups = win.add("group", undefined, "");
allGroups.orientation = "stack";
var manualCropSettingsGroup = allGroups.add("group", undefined, "");
manualCropSettingsGroup.orientation = "column";
var bipedAutoCropSettingsGroup = allGroups.add("group", undefined, "");
bipedAutoCropSettingsGroup.orientation = "column";
var fixedCenterCropGroup = allGroups.add("group", undefined, "");
fixedCenterCropGroup.orientation = "column";
	
// 下拉菜单 onChange 方法
whichInfo.onChange = function () {
    if (this.selection != null) {
        for (var g = 0; g < this.items.length; g++){
            this.items[g].group.visible = false;
        }
        this.selection.group.visible = true;
    }
}
// 下拉菜单添加 item
var item = whichInfo.add ("item", "手动选区裁剪");
item.group = manualCropSettingsGroup;
item = whichInfo.add ("item", "自动裁剪(直立类生物)");
item.group = bipedAutoCropSettingsGroup;
item = whichInfo.add ("item", "固定中心线裁剪");
item.group = fixedCenterCropGroup;
// 默认为“手动选区裁剪”菜单
whichInfo.selection = whichInfo.items[0];

// ===================== 下拉菜单：手动选区裁剪 =====================

// 其它 Toggle
var faceDirectionCheckBox_MG = manualCropSettingsGroup.add("checkbox", undefined, "面朝方向为左");
var needDrawGuideLineCheckbox_MG = manualCropSettingsGroup.add("checkbox", undefined, "绘制出参考线");
var needExportCSVFileCheckbox_MG = manualCropSettingsGroup.add("checkbox", undefined, "同时导出CSV");
var needHorizontalScalingCheckbox_MG = manualCropSettingsGroup.add("checkbox", undefined, "水平方向扩展");
var needVerticalScalingCheckbox_MG = manualCropSettingsGroup.add("checkbox", undefined, "垂直方向扩展");
faceDirectionCheckBox_MG.value = true;
needDrawGuideLineCheckbox_MG.value = true;
needExportCSVFileCheckbox_MG.value = true;
needHorizontalScalingCheckbox_MG.value = true;
needVerticalScalingCheckbox_MG.value = false;

// 裁剪当前文档 Button
var manualCropCurrentDocumentButton = manualCropSettingsGroup.add("button", undefined, "裁剪当前文档");
manualCropCurrentDocumentButton.onClick = function() 
{
    SyncManualCropSettingsParameters();
    if (app.documents.length === 0) 
    {
        alert("没有打开任何文档，请先打开文档再进行裁剪");
        return;
    }

    if(manualCropSettings.needExportCSVFile)
    {
        // 打开或创建CSV文件
        var folder = Folder.selectDialog("选择导出文件夹");
        if (!folder) 
        {
            alert("未选择导出文件夹，取消裁剪");
            return;
        }
        var csvFile = new File(folder.fsName + "/offsets.csv");
        var fileExists = csvFile.exists;
        csvFile.open("a");  // 追加打开文件，如果不存在则自动创建
        if (!fileExists) 
        {
            csvFile.writeln("文件名,中心点X,中心点Y,偏移量X,偏移量Y");
        }
        
        // 写入CSV并裁剪
        var doc = app.activeDocument;
        var preCenter = null;
        try
        {
            var bounds = doc.selection.bounds;
        }
        catch (e) 
        {
            alert("文档 " + doc.name + " 的选区不存在，请先手动框选选区");
            return;
        }
        var center = CenterOfBound(bounds);
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
        if(manualCropSettings.faceLeft)
        {
            offsetX = -offsetX;
            offsetY = -offsetY;
        }
        csvFile.writeln(doc.name + "," + center.x + "," + center.y + "," + offsetX + "," + offsetY);
        preCenter = center;
        ManualCropCurrentDocument(doc);
        
        // 写入结束，关闭文件
        if (csvFile) 
            csvFile.close();
    }
    else
    {
        var doc = app.activeDocument;
        try
        {
            var bounds = doc.selection.bounds;
        }
        catch (e) 
        {
            alert("文档 " + doc.name + " 的选区不存在，请先手动框选选区");
            return;
        }
        var doc = app.activeDocument;
        ManualCropCurrentDocument(doc);
    }
};

// 裁剪所有打开文档 Button
var manualCropAllOpenedDocumentButton = manualCropSettingsGroup.add("button", undefined, "裁剪所有打开文档");
manualCropAllOpenedDocumentButton.onClick = function() 
{
    SyncManualCropSettingsParameters();
    if (app.documents.length === 0) 
    {
        alert("没有打开任何文档，请先打开文档再进行裁剪");
        return;
    }

    if(manualCropSettings.needExportCSVFile)
    {
        // 打开或创建CSV文件
        var folder = Folder.selectDialog("选择导出文件夹");
        if (!folder) 
        {
            alert("未选择导出文件夹，取消裁剪");
            return;
        }
        var csvFile = new File(folder.fsName + "/offsets.csv");
        var fileExists = csvFile.exists;
        csvFile.open("a");  // 追加打开文件，如果不存在则自动创建
        if (!fileExists) 
        {
            csvFile.writeln("文件名,中心点X,中心点Y,偏移量X,偏移量Y");
        }
        
        // 遍历所有文档进行处理
        var docs = app.documents;
        var preCenter = null;
        for (var i = 0; i < docs.length; i++) 
        {
            var doc = docs[i];
            app.activeDocument = doc;
            try
            {
                var bounds = doc.selection.bounds;
            }
            catch (e) 
            {
                alert("文档 " + doc.name + " 的选区不存在，请先手动框选选区");
                return;
            }
            var center = CenterOfBound(bounds);
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
            if(manualCropSettings.faceLeft)
            {
                offsetX = -offsetX;
                offsetY = -offsetY;
            }
            csvFile.writeln(doc.name + "," + center.x + "," + center.y + "," + offsetX + "," + offsetY);
            preCenter = center;
            ManualCropCurrentDocument(doc);
        }
        // 写入结束，关闭文件
        if (csvFile) 
            csvFile.close();
    }
    else
    {
        for (var i = 0; i < docs.length; i++) 
        {
            var doc = docs[i];
            app.activeDocument = doc;
            try
            {
                var bounds = doc.selection.bounds;
            }
            catch (e) 
            {
                alert("文档 " + doc.name + " 的选区不存在，请先手动框选选区");
                return;
            }
            ManualCropCurrentDocument(doc);
        }
    }
};

// 保存所有打开文档 Button
var saveAllOpenedDocumentButton = manualCropSettingsGroup.add("button", undefined, "保存所有打开文档（覆盖）");
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
    for (var i = 0; i < docs.length; i++) {
        var doc = docs[i]; // 当前文档
        // 激活当前文档
        app.activeDocument = doc;
        SaveDocument(doc);
    }
};


// ===================== 下拉菜单：自动裁剪(直立类生物) =====================

// 居中锚点方式 Toggle Group
var radioGroup = bipedAutoCropSettingsGroup.add("panel", undefined, "居中锚点方式");
radioGroup.orientation = "row";
var radio1_BG = radioGroup.add("radiobutton", undefined, "底部中心");
var radio2_BG = radioGroup.add("radiobutton", undefined, "顶部中心");
radio1_BG.value = true;

// 底部（顶部）容忍度 InputField 
var inputGroup = bipedAutoCropSettingsGroup.add("group");
inputGroup.add("statictext", undefined, "底部/顶部 范围:");
var inputField_BG = inputGroup.add("edittext", [0, 0, 20, 20], bipedAutoCropSettings.toleranceOfBottom);

// 其它 Toggle
var faceDirectionCheckBox_BG = bipedAutoCropSettingsGroup.add("checkbox", undefined, "面朝方向为左");
var needDrawGuideLineCheckbox_BG = bipedAutoCropSettingsGroup.add("checkbox", undefined, "绘制出参考线");
var neddCropTopCheckbox_BG= bipedAutoCropSettingsGroup.add("checkbox", undefined, "裁剪顶部空白");
var neddCropBottomCheckbox_BG = bipedAutoCropSettingsGroup.add("checkbox", undefined, "裁剪底部空白");
faceDirectionCheckBox_BG.value = true;
needDrawGuideLineCheckbox_BG.value = true;
neddCropTopCheckbox_BG.value = true;
neddCropBottomCheckbox_BG.value = true;

// 裁剪当前文档 Button
var cropCurrentDocumentButton = bipedAutoCropSettingsGroup.add("button", undefined, "裁剪当前文档");
cropCurrentDocumentButton.onClick = function() 
{
    if (!SyncBipedAutoCropSettingsParameters()) return;
    if (app.documents.length === 0) 
    {
        alert("没有打开任何文档，请先打开文档再进行裁剪");
        return;
    }

    var doc = app.activeDocument;
    BipedAutoCropCurrentDocument(doc);
};

// 裁剪所有打开文档 Button
var cropAllOpenedDocumentButton = bipedAutoCropSettingsGroup.add("button", undefined, "裁剪所有打开文档");
cropAllOpenedDocumentButton.onClick = function() 
{
    if (!SyncBipedAutoCropSettingsParameters()) return;
    if (app.documents.length === 0) 
    {
        alert("没有打开任何文档，请先打开文档再进行裁剪");
        return;
    }

    var docs = app.documents;
    for (var i = 0; i < docs.length; i++) {
        var doc = docs[i];
        app.activeDocument = doc;
        BipedAutoCropCurrentDocument(doc);
    }
};

// 导出所有文档锚点到CSV
var exportCSVOnlyButton = bipedAutoCropSettingsGroup.add("button", undefined, "导出所有文档锚点到CSV");
exportCSVOnlyButton.onClick = function() 
{
    if (!SyncBipedAutoCropSettingsParameters()) return;
    if (app.documents.length === 0) 
    {
        alert("没有打开任何文档，请先打开文档再进行裁剪");
        return;
    }

    // 打开或创建CSV文件
    var folder = Folder.selectDialog("选择导出文件夹");
    if (!folder) 
    {
        alert("未选择导出文件夹，取消裁剪");
        return;
    }
    var csvFile = new File(folder.fsName + "/offsets.csv");
    var fileExists = csvFile.exists;
    csvFile.open("a");  // 追加打开文件，如果不存在则自动创建
    if (!fileExists) 
    {
        csvFile.writeln("文件名,中心点X,中心点Y,偏移量X,偏移量Y");
    }
    
    var docs = app.documents;
    var preCenter = null;
    for (var i = 0; i < docs.length; i++) 
    {
        var doc = docs[i];
        app.activeDocument = doc;
        try{
            var currentLayer = doc.activeLayer;
            var currentLayerBounds = currentLayer.bounds;
            var center= CenterOfBound (currentLayerBounds);
        }catch(e){
            alert (e.message);
        }
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
        if(bipedAutoCropSettings.faceLeft)
        {
            offsetX = -offsetX;
            offsetY = -offsetY;
        }
        csvFile.writeln(doc.name + "," + center.x + "," + center.y + "," + offsetX + "," + offsetY);
        preCenter = center;
    }
    // 写入结束，关闭文件
    if (csvFile) 
        csvFile.close();
};

// 保存所有打开文档 Button
var saveAllOpenedDocumentButton = bipedAutoCropSettingsGroup.add("button", undefined, "保存所有打开文档（覆盖）");
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
    for (var i = 0; i < docs.length; i++) {
        var doc = docs[i]; // 当前文档
        // 激活当前文档
        app.activeDocument = doc;
        SaveDocument(doc);
    }
};


// ===================== 下拉菜单：固定中心线裁剪 =====================

// 锚点x坐标
var inputFixedCenterGroup = fixedCenterCropGroup.add("group");
inputFixedCenterGroup.add("statictext", undefined, "中心锚点:");
var inputFixedCenterGroup_FG = inputFixedCenterGroup.add("edittext", [0, 0, 50, 20], fixedCenterCropSettings.pivotX);

// 其它 Toggle
var needDrawGuideLineCheckbox_FG = fixedCenterCropGroup.add("checkbox", undefined, "绘制出参考线");
var neddCropTopCheckbox_FG= fixedCenterCropGroup.add("checkbox", undefined, "裁剪顶部空白");
var neddCropBottomCheckbox_FG = fixedCenterCropGroup.add("checkbox", undefined, "裁剪底部空白");
needDrawGuideLineCheckbox_FG.value = true;
neddCropTopCheckbox_FG.value = true;
neddCropBottomCheckbox_FG.value = true;

// 裁剪当前文档 Button
var cropCurrentDocumentButton_FG = fixedCenterCropGroup.add("button", undefined, "裁剪当前文档");
cropCurrentDocumentButton_FG.onClick = function() 
{
    if (!SyncFixedCenterCropSettingsParameters()) return;
    if (app.documents.length === 0) 
    {
        alert("没有打开任何文档，请先打开文档再进行裁剪");
        return;
    }

    var doc = app.activeDocument;
    CropByFixedPivot(doc, fixedCenterCropSettings.pivotX);
};

// 裁剪所有打开文档 Button
var cropAllOpenedDocumentButton = fixedCenterCropGroup.add("button", undefined, "裁剪所有打开文档");
cropAllOpenedDocumentButton.onClick = function() 
{
    if (!SyncFixedCenterCropSettingsParameters()) return;
    if (app.documents.length === 0) 
    {
        alert("没有打开任何文档，请先打开文档再进行裁剪");
        return;
    }

    var docs = app.documents;
    for (var i = 0; i < docs.length; i++) {
        var doc = docs[i];
        app.activeDocument = doc;
        CropByFixedPivot(doc, fixedCenterCropSettings.pivotX);
    }
};

// 保存所有打开文档 Button
var saveAllOpenedDocumentButton = fixedCenterCropGroup.add("button", undefined, "保存所有打开文档（覆盖）");
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
    for (var i = 0; i < docs.length; i++) {
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

// 同步自动裁剪的参数
function SyncBipedAutoCropSettingsParameters()
{
    bipedAutoCropSettings.faceLeft = faceDirectionCheckBox_BG.value;
    bipedAutoCropSettings.needDrawGuideLine = needDrawGuideLineCheckbox_BG.value;
    bipedAutoCropSettings.needCropTop = neddCropTopCheckbox_BG.value;
    bipedAutoCropSettings.needCropBottom = neddCropBottomCheckbox_BG.value;
    bipedAutoCropSettings.isBottomCenter = radio1_BG.value;
    
    var userInput = inputField_BG.text;
    var integerInput = parseInt(userInput, 10);

    if (!isNaN(integerInput) && userInput>=0 ) {
        bipedAutoCropSettings.toleranceOfBottom = integerInput;
        return true;
    } else {
        alert("请输入有效的非负整数");
        return false;
    }
}

// 同步手动选区裁剪的参数
function SyncManualCropSettingsParameters()
{
    manualCropSettings.faceLeft = faceDirectionCheckBox_MG.value;
    manualCropSettings.needDrawGuideLine = needDrawGuideLineCheckbox_MG.value;
    manualCropSettings.needExportCSVFile = needExportCSVFileCheckbox_MG.value;
    manualCropSettings.needHorizontalScaling = needHorizontalScalingCheckbox_MG.value;
    manualCropSettings.needVerticalScaling= needVerticalScalingCheckbox_MG.value;
}
// 同步固定中心线裁剪的参数
function SyncFixedCenterCropSettingsParameters()
{
    fixedCenterCropSettings.needCropTop = needDrawGuideLineCheckbox_FG.value;
    fixedCenterCropSettings.needCropBottom = neddCropTopCheckbox_FG.value;
    fixedCenterCropSettings.needDrawGuideLine = neddCropBottomCheckbox_FG.value;    
    
    var userInput = inputFixedCenterGroup_FG.text;
    var integerInput = parseInt(userInput, 10);

    if (!isNaN(integerInput) && userInput>=0 ) {
        fixedCenterCropSettings.pivotX = integerInput;
        return true;
    } else {
        alert("请输入有效的非负整数");
        return false;
    }
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
function ManualCropCurrentDocument(doc) 
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

    
    if(manualCropSettings.needDrawGuideLine)
    {
        // 添加最大边界位置的参考线
        var guideLeftMincrop = doc.guides.add(Direction.VERTICAL, new UnitValue(currentLayerLeftMinPosition, "px"));  // 添加最左侧参考线
        var guideRightMaxcrop = doc.guides.add(Direction.VERTICAL, new UnitValue(currentLayerRightMaxPosition, "px")); // 添加最右侧参考线
        var guideTopMincrop = doc.guides.add(Direction.HORIZONTAL, new UnitValue(currentLayerTopMinPositon, "px")); // 添加最上方参考线
        var guideBottomMaxcrop = doc.guides.add(Direction.HORIZONTAL, new UnitValue(currentLayerBottomMaxPosition, "px"));    // 添加最下方参考线
        // 中心点位置参考线
        var guidePivotV = doc.guides.add(Direction.VERTICAL, new UnitValue((leftBound+rightBound)*0.5, "px"));
        var guidePivotH = doc.guides.add(Direction.HORIZONTAL, new UnitValue((topBound+bottomBound)*0.5, "px"));
    }

     // 定义最终的裁剪区域
    var cropRegion; 
    var cropAngle = 0
    var finalCropLeftPosition;
    var finalCropRightPosition;
    var finalCropToptPosition;
    var finalCropBottomPosition;
    
    // 是否水平方向扩展
    if(manualCropSettings.needHorizontalScaling)
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
    if(manualCropSettings.needVerticalScaling)
    {
        var topDifference= Math.abs(currentLayerTopMinPositon - topBound);
        var bottomDifference = Math.abs(bottomBound - currentLayerBottomMaxPosition)
        if(topDifference > bottomDifference)
        {
            finalCropToptPosition = currentLayerTopMinPositon;
            finalCropBottomPosition = bottomBound - topDifference;
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

    cropRegion = [finalCropLeftPosition, finalCropToptPosition, finalCropRightPosition, finalCropBottomPosition];
    // 设置裁剪区域
    doc.crop(cropRegion, cropAngle);
}

// 自动裁剪当前文档（直立类生物）
function BipedAutoCropCurrentDocument(doc) 
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
    if(bipedAutoCropSettings.needDrawGuideLine)
    {
        var guideLeftMincrop = doc.guides.add(Direction.VERTICAL, new UnitValue(currentLayerLeftMinPosition, "px"));  // 添加最左侧参考线
        var guideRightMaxcrop = doc.guides.add(Direction.VERTICAL, new UnitValue(currentLayerRightMaxPosition, "px")); // 添加最右侧参考线
        if(bipedAutoCropSettings.needCropTop)
        {
            var guideTopMincrop = doc.guides.add(Direction.HORIZONTAL, new UnitValue(currentLayerTopMinPositon, "px")); // 添加最上方参考线
        }
        if(bipedAutoCropSettings.needCropBottom)
        {
            var guideBottomMaxcrop = doc.guides.add(Direction.HORIZONTAL, new UnitValue(currentLayerBottomMaxPosition, "px"));    // 添加最下方参考线
        }
    }

    // 复制图层重新获取一个区域范围的边界
    var duplLayer = currentLayer.duplicate();
    doc.activeLayer = duplLayer;
    var tempLayer = doc.activeLayer;
    
    // 根据锚点居中方式以及底部/顶部 容忍度获取选区
    var selectionRegion;
    if(bipedAutoCropSettings.isBottomCenter)
    {
        selectionRegion= [
            [0, 0],
            [docWidth, 0], 
            [docWidth, docHeight - bipedAutoCropSettings.toleranceOfBottom],
            [0, docHeight - bipedAutoCropSettings.toleranceOfBottom]
        ];
    }
    else
    {
        selectionRegion= [
            [0, docHeight - bipedAutoCropSettings.toleranceOfBottom],
            [docWidth, docHeight - bipedAutoCropSettings.toleranceOfBottom], 
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

    if(bipedAutoCropSettings.needDrawGuideLine)
    {
        var guideLeftBottomcrop = doc.guides.add(Direction.VERTICAL, new UnitValue(leftBound, "px"));
        var guideRightBottomcrop =doc.guides.add(Direction.VERTICAL, new UnitValue(rightBound, "px"));
    }

    try 
    {
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

    if(bipedAutoCropSettings.needCropTop)
    {
        finalCropToptPosition = currentLayerTopMinPositon;
    }
    else
    {
        finalCropToptPosition = 0;
    }

    if(bipedAutoCropSettings.needCropBottom)
    {
        finalCropBottomPosition = currentLayerBottomMaxPosition;
    }
    else
    {
        finalCropBottomPosition = docHeight;
    }

    cropRegion = [finalCropLeftPosition, finalCropToptPosition, finalCropRightPosition, finalCropBottomPosition];

/*
    var centerX = (finalCropLeftPosition + finalCropRightPosition) * 0.5;
    var centerY = (finalCropToptPosition + finalCropBottomPosition) * 0.5;
    
    // 根据角色的左右朝向，决定偏移值的正负，保证偏移值的正始终代表着角色的“正面”前进方向，负代表角色的“背后”后退方向
    if(bipedAutoCropSettings.faceLeft)
    {
        offsetX = -offsetX;
        offsetY = -offsetY;
    }
    csvFile.writeln(doc.name + "," + centerX  + "," + centerY + "," + offsetX + "," + offsetY);
*/
    // 设置裁剪区域
    doc.crop(cropRegion, cropAngle);
}

// 已知中心锚点，裁剪当前文档
function CropByFixedPivot(doc, pivotX)
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
    if(fixedCenterCropSettings.needDrawGuideLine)
    {
        var guideLeftMincrop = doc.guides.add(Direction.VERTICAL, new UnitValue(currentLayerLeftMinPosition, "px"));  // 添加最左侧参考线
        var guideRightMaxcrop = doc.guides.add(Direction.VERTICAL, new UnitValue(currentLayerRightMaxPosition, "px")); // 添加最右侧参考线
        if(fixedCenterCropSettings.needCropTop)
        {
            var guideTopMincrop = doc.guides.add(Direction.HORIZONTAL, new UnitValue(currentLayerTopMinPositon, "px")); // 添加最上方参考线
        }
        if(fixedCenterCropSettings.needCropBottom)
        {
            var guideBottomMaxcrop = doc.guides.add(Direction.HORIZONTAL, new UnitValue(currentLayerBottomMaxPosition, "px"));    // 添加最下方参考线
        }
    }

    var leftDistance = Math.abs(pivotX - currentLayerLeftMinPosition);
    var rightDistance = Math.abs(currentLayerRightMaxPosition - pivotX);
    var halfWidth = Math.max(leftDistance, rightDistance);
    var cropLeft = pivotX - halfWidth;
    var cropRight = pivotX + halfWidth;
    var cropTop = 0;
    if(fixedCenterCropSettings.needCropTop)
    {
        cropTop = currentLayerTopMinPositon;
    }
    var cropBottom = docHeight;
    if(fixedCenterCropSettings.needCropBottom)
    {
        cropBottom = currentLayerBottomMaxPosition;
    }

    doc.crop([cropLeft, cropTop, cropRight, cropBottom], 0);
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