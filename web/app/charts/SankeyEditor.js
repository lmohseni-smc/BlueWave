if(!bluewave) var bluewave={};
if(!bluewave.charts) bluewave.charts={};

//******************************************************************************
//**  SankeyEditor
//******************************************************************************
/**
 *   Panel used to create Sankey charts
 *
 ******************************************************************************/

bluewave.charts.SankeyEditor = function(parent, config) {

    var me = this;
    var defaultConfig = {
        margin: { top: 10, right: 10, bottom: 10, left: 10 }
    };

    var editPanel, previewPanel, waitmask; //primary components
    var toolbar;
    var tooltip, tooltipTimer, lastToolTipEvent;
    var button = {};
    var nodes = {};
    var quantities = {};
    var drawflow, currModule;
    var button = {};
    var nodeEditor;
    var sankeyChart;
    var toggleButton;


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){

        config = merge(config, defaultConfig);
        if (!config.style) config.style = javaxt.dhtml.style.default;
        if (!config.waitmask) config.waitmask = new javaxt.express.WaitMask(document.body);
        waitmask = config.waitmask;


      //Create main panel
        var div = document.createElement("div");
        div.style.height = "100%";
        div.style.position = "relative";
        createToggleButton(div);



      //Create preview panel
        previewPanel = document.createElement("div");
        previewPanel.style.height = "100%";
        previewPanel.style.textAlign = "center";
        div.appendChild(previewPanel);
        addShowHide(previewPanel);
        createSankey(previewPanel);
        previewPanel.hide();


      //Create editor
        editPanel = document.createElement("div");
        editPanel.className = "drawflow";
        editPanel.ondrop = drop;
        editPanel.ondragover = function(e){
            e.preventDefault();
        };
        div.appendChild(editPanel);
        createDrawFlow(editPanel);
        createToolbar(editPanel);
        addShowHide(editPanel);



        parent.appendChild(div);
        me.el = div;
        addShowHide(me);
    };


  //**************************************************************************
  //** clear
  //**************************************************************************
    this.clear = function(){
        drawflow.clear();
        drawflow.removeModule(currModule);
        sankeyChart.clear();
        nodes = {};
        quantities = {};
    };


  //**************************************************************************
  //** update
  //**************************************************************************
    this.update = function(sankeyConfig){
        me.clear();

        if (!sankeyConfig) sankeyConfig = {};


      //Update toggle button
        toggleButton.setValue("Edit");


      //Set module
        currModule = "sankey_" + new Date().getTime();
        drawflow.addModule(currModule);
        drawflow.changeModule(currModule);


      //Import layout
        if (sankeyConfig.layout){
            var data = {
                drawflow: {}
            };
            data.drawflow[currModule] = {
                data : sankeyConfig.layout
            };
            drawflow.import(data);
        }


      //Update nodes
        for (var nodeID in sankeyConfig.nodes) {
            if (sankeyConfig.nodes.hasOwnProperty(nodeID)){

              //Get node (dom object)
                var drawflowNode = drawflow.getNodeFromId(nodeID);
                var temp = document.createElement("div");
                temp.innerHTML = drawflowNode.html;
                var node = document.getElementById(temp.childNodes[0].id);


              //Add props to node
                var props = sankeyConfig.nodes[nodeID];
                for (var key in props) {
                    if (props.hasOwnProperty(key)){
                        var val = props[key];
                        node[key] = val;
                    }
                }



              //Add event listeners
                addEventListeners(node);



              //Add inputs
                node.inputs = {};
                for (var key in drawflowNode.inputs) {
                    if (drawflowNode.inputs.hasOwnProperty(key)){
                        var connections = drawflowNode.inputs[key].connections;
                        for (var i in connections){
                            var connection = connections[i];
                            var inputID = connection.node;
                            var inputNode = nodes[inputID];
                            node.inputs[inputID] = inputNode;
                        }
                    }
                }


              //Update nodes variable
                nodes[nodeID] = node;

            }
        }



      //Fill in any missing node inputs
        for (var nodeID in nodes){
            var node = nodes[nodeID];
            for (var inputID in node.inputs){
                var inputNode = node.inputs[inputID];
                if (!inputNode) node.inputs[inputID] = nodes[inputID];
            }
        }



      //Update paths and quantities
        var connections = editPanel.getElementsByTagName("svg");
        for (var i=0; i<connections.length; i++){
            var connection = connections[i];
            var classes = connection.className;
            if (classes.baseVal) classes = classes.baseVal;
            var inputID, outputID;
            var arr = classes.split(" ");
            for (var j=0; j<arr.length; j++){
                var str = arr[j].trim();
                var idx = str.indexOf("node_in_node");
                if (idx===0) outputID = str.substring("node_in_node".length+1);
                var idx = str.indexOf("node_out_node");
                if (idx===0) inputID = str.substring("node_out_node".length+1);
            }

            var key = inputID + "->" + outputID;
            var link = sankeyConfig.links[key];


          //Update quantities
            quantities[key] = link.quantity;


          //Update svg paths (drawflow doesn't import correctly)
            connection.getElementsByTagName("path")[0].setAttribute("d", link.path);
            auditLinkages();
        }
    };


  //**************************************************************************
  //** getConfig
  //**************************************************************************
    this.getConfig = function(){

      //Create basic config
        var sankeyConfig = {
            layout: drawflow.export().drawflow[currModule].data,
            nodes: {},
            links: {}
        };


      //Update layout (html in the layout is not synced with the dom)
        for (var key in sankeyConfig.layout) {
            if (sankeyConfig.layout.hasOwnProperty(key)){
                var node = sankeyConfig.layout[key];
                node.html = nodes[key].parentNode.innerHTML;
            }
        }


      //Update nodes
        for (var key in nodes) {
            if (nodes.hasOwnProperty(key)){
                var node = nodes[key];
                sankeyConfig.nodes[key] = {
                    name: node.name,
                    type: node.type,
                    notes: node.notes
                };
            }
        };


      //Update links
        var connections = editPanel.getElementsByTagName("svg");
        for (var i=0; i<connections.length; i++){
            var connection = connections[i];
            var classes = connection.className;
            if (classes.baseVal) classes = classes.baseVal;
            var inputID, outputID;
            var arr = classes.split(" ");
            for (var j=0; j<arr.length; j++){
                var str = arr[j].trim();
                var idx = str.indexOf("node_in_node");
                if (idx===0) outputID = str.substring("node_in_node".length+1);
                var idx = str.indexOf("node_out_node");
                if (idx===0) inputID = str.substring("node_out_node".length+1);
            }
            var path = connection.getElementsByTagName("path")[0];
            if (path) path = path.getAttribute("d");
            var key = inputID + "->" + outputID;

            sankeyConfig.links[key] = {
                path: path,
                quantity: quantities[key]
            };
        }


        return sankeyConfig;
    };


  //**************************************************************************
  //** getChart
  //**************************************************************************
    this.getChart = function(){
        if (!previewPanel.isVisible()) toggleButton.setValue("Preview");
        return previewPanel;
    };


  //**************************************************************************
  //** createToolbar
  //**************************************************************************
    var createToolbar = function(parent){
        toolbar = document.createElement("div");
        toolbar.className = "drawflow-toolbar";
        parent.appendChild(toolbar);


      //Create tooltip
        tooltip = new javaxt.dhtml.Callout(document.body,{
            style: {
                panel: "tooltip-panel",
                arrow: "tooltip-arrow"
            }
        });
        var _hideToolTip = tooltip.hide;
        tooltip.hide = function(){
            if (tooltipTimer) clearTimeout(tooltipTimer);
            _hideToolTip();
        };



      //Create buttons
        createButton("factory", "fas fa-industry", "Factory");
        createButton("distributor", "fas fa-store-alt", "Distributor");
        createButton("hospital", "fas fa-hospital-user", "Hospital");


      //Enable addData button
        button.factory.enable();
        button.distributor.enable();
        button.hospital.enable();
    };

  //**************************************************************************
  //** getPreviousNodeValue
  //**************************************************************************
    var getPreviousNodeValue = function(previousNodeId){
        var node = nodes[previousNodeId];
        var inputs = node.inputs;
        var quantity = 0;
        for(var k in inputs) {
            if(inputs.hasOwnProperty(k)) {
                var v = quantities[k + "->" + previousNodeId];
                quantity = quantity + v;
            }
        }
        if(quantity == 0){
            quantity = 1;
        }
        return quantity
    };


  //**************************************************************************
  //** auditNodes
  //**************************************************************************
    var auditNodes = function(){
        for (var key in nodes) {
             var node = nodes[key];
             var inputs = node.inputs;
             var outputs = getOutputs(key);
             var inputQuantity = 0;
             var outputQuantity = 0;
             for(var k in inputs) {
                if(inputs.hasOwnProperty(k)) {
                    var n = nodes[k];
                    var v = quantities[k + "->" + key];
                    inputQuantity = inputQuantity + v;
                }

            }
            for(i = 0; i < outputs.length; i++) {
                var k = outputs[i];
                var n = nodes[k];
                var v = quantities[key + "->" + k];
                outputQuantity = outputQuantity + v;
            }
            var data = drawflow.drawflow.drawflow[currModule].data;
            var value = data[key];
            if(checkInputsAndOutputs(value) && inputQuantity != outputQuantity) {
                node.style.color = "red";
            } else {
                node.style.color = "black";
            }
        }
        auditLinkages();
    };


  //**************************************************************************
  //** getOutputs
  //**************************************************************************
    var getOutputs = function(value) {
        var outputs = [];
        for (var key in nodes) {
            var n = nodes[key];
            var inputs = n.inputs;
            for(var k in inputs) {
                if(value === k) {
                    outputs.push(key);
                }
            }
        }
        return outputs;
    };


  //**************************************************************************
  //** checkInputsAndOutputs
  //**************************************************************************
    var checkInputsAndOutputs = function (data) {
            if(Object.keys(data.inputs).length === 0) {
                return false;
            }
            if(Object.keys(data.outputs).length === 0) {
                return false;
            }
        return true;
    };


  //**************************************************************************
  //** auditLinkages
  //**************************************************************************
    var auditLinkages = function(){
        var linkages = editPanel.getElementsByClassName("connection");
        for(var item of linkages) {
            var classNames = item.classList;
            var nodeList = [];
            for(var name of classNames) {
                if(name.includes("node")){
                    nodeList.push(name);
                }
            }
            var path = item.children[0];
            checkLinkage(nodeList, path);
        }
    };


  //**************************************************************************
  //** checkLinkage
  //**************************************************************************
    var checkLinkage = function(nodeList, path){
        var inputID = nodeList[0].substring("node_in_node".length+1);
        var outputID = nodeList[1].substring("node_out_node".length+1);
        var nodeIn = nodes[inputID];
        var nodeOut = nodes[outputID];
        if(typeof nodeIn !== 'undefined' || typeof nodeOut !== 'undefined'){
            if (nodeIn.style.color == "red" || nodeOut.style.color == "red"){
                path.style.stroke = "red";
            }
            else {
                path.style.stroke = "";
            }
        }
    };


  //**************************************************************************
  //** createDrawFlow
  //**************************************************************************
    var createDrawFlow = function(parent){

      //Create drawflow
        drawflow = new Drawflow(parent);
        drawflow.reroute = true;
        drawflow.start();


      //Watch for click events
        var x,y;
        drawflow.on('click', function(e){
            x = e.clientX;
            y = e.clientY;
        });


      //Watch for link creation
        drawflow.on('connectionCreated', function(info) {
            var outputID = info.output_id+"";
            var inputID = info.input_id+"";
            //console.log("Connected " + outputID + " to " + inputID);

          //Update nodes
            var node = nodes[inputID];
            node.inputs[outputID] = nodes[outputID];
            var value = getPreviousNodeValue(outputID);
          //Update quantities
            quantities[outputID + "->" + inputID] = value;
            auditNodes();
        });


      //Watch for link removals
        drawflow.on('connectionRemoved', function(info){
            var outputID = info.output_id+"";
            var inputID = info.input_id+"";
            //console.log("Removed connection " + outputID + " to " + inputID);
            delete quantities[outputID + "->" + inputID];
            auditNodes();
        });


      //Watch for node removals
        drawflow.on('nodeRemoved', function(nodeID) {
            delete nodes[nodeID+""];
            auditNodes();
        });


      //Process link click events
        drawflow.on('connectionSelected', function(info){
            var outputID = info.output_id+"";
            var inputID = info.input_id+"";
            var currVal = quantities[outputID + "->" + inputID];
            //console.log("Clicked link between " + outputID + " and " + inputID);

            var div = document.createElement("div");
            div.style.minWidth = "50px";
            div.style.textAlign = "center";
            div.innerHTML = currVal;
            div.onclick = function(e){
                if (this.childNodes[0].nodeType===1) return;
                e.stopPropagation();
                this.innerHTML = "";
                var input = document.createElement("input");
                input.className = "form-input";
                input.type = "text";
                input.value = currVal;
                input.onkeydown = function(event){
                    var key = event.keyCode;
                    if (key === 13) {
                        var val = parseFloat(this.value);
                        div.innerHTML = val;
                        quantities[outputID + "->" + inputID] = val;
                        auditNodes();
                    }
                };
                this.appendChild(input);
                input.focus();
            };

            tooltip.getInnerDiv().innerHTML = "";
            tooltip.getInnerDiv().appendChild(div);
            tooltip.showAt(x, y, "right", "center");
        });
    };


  //**************************************************************************
  //** drag
  //**************************************************************************
    var drag = function(ev) {
        if (ev.type === "touchstart") {
            /*
            mobile_item_selec = ev.target
                .closest(".drag-drawflow")
                .getAttribute("data-node");
            */
        }
        else {
            ev.dataTransfer.setData(
                "node",
                ev.target.getAttribute("data-node")
            );
        }
    };


  //**************************************************************************
  //** drop
  //**************************************************************************
    var drop = function(ev) {
        if (ev.type === "touchend") {
            /*
            let parentdrawflow = document
                .elementFromPoint(
                    mobile_last_move.touches[0].clientX,
                    mobile_last_move.touches[0].clientY
                )
                .closest("#drawflow");
            if (parentdrawflow != null) {
                addNodeToDrawFlow(
                    mobile_item_selec,
                    mobile_last_move.touches[0].clientX,
                    mobile_last_move.touches[0].clientY
                );
            }
            mobile_item_selec = "";
            */
        }
        else {
            ev.preventDefault();
            let nodeType = ev.dataTransfer.getData("node");
            addNodeToDrawFlow(nodeType, ev.clientX, ev.clientY);
        }
    };


  //**************************************************************************
  //** addNodeToDrawFlow
  //**************************************************************************
    var addNodeToDrawFlow = function (nodeType, pos_x, pos_y) {
        if (drawflow.editor_mode === "fixed") {
            return false;
        }
        pos_x =
            pos_x *
                (drawflow.precanvas.clientWidth /
                    (drawflow.precanvas.clientWidth * drawflow.zoom)) -
            drawflow.precanvas.getBoundingClientRect().x *
                (drawflow.precanvas.clientWidth /
                    (drawflow.precanvas.clientWidth * drawflow.zoom));
        pos_y =
            pos_y *
                (drawflow.precanvas.clientHeight /
                    (drawflow.precanvas.clientHeight * drawflow.zoom)) -
            drawflow.precanvas.getBoundingClientRect().y *
                (drawflow.precanvas.clientHeight /
                    (drawflow.precanvas.clientHeight * drawflow.zoom));


        var btn = button[nodeType];
        if (!btn){
            console.log("Unsupported Node Type: " + nodeType);
            return;
        }


      //Set name
        var name = btn.el.dataset["title"];
        var id = 0;
        for (var key in nodes) {
            if (nodes.hasOwnProperty(key)){
                var node = nodes[key];
                var type = node.type;
                if (type===nodeType){
                    id++;
                }
            }
        }
        if (id>0) name += " " + (id+1);


      //Set icon
        var icon = btn.el.dataset["icon"];
        var i = document.createElement("i");
        i.className = icon;


        var numInputs = 0;
        var numOutputs = 0;

        switch (nodeType) {
            case "factory":
                numOutputs = 1;
                break;
            case "hospital":
                numInputs = 1;
                break;
            default:
                numInputs = 1;
                numOutputs = 1;
                break;
        }


        var node = createNode({
            name: name,
            type: nodeType,
            icon: icon,
            content: i,
            position: [pos_x, pos_y],
            inputs: numInputs,
            outputs: numOutputs
        });

        addEventListeners(node);
    };


  //**************************************************************************
  //** addEventListeners
  //**************************************************************************
    var addEventListeners = function(node){
        node.ondblclick = function(){
            editNode(this);
        };
    };


  //**************************************************************************
  //** createNode
  //**************************************************************************
    var createNode = function(node){

      //Create content div for a drawflow node
        var nodeID = new Date().getTime();
        var div = document.createElement("div");
        div.id = "drawflow_node_"+nodeID;
        var title = document.createElement("div");
        title.className = "drawflow-node-title";
        title.innerHTML = "<i class=\"" + node.icon + "\"></i><span>" + node.name + "</span>";
        div.appendChild(title);
        var body = document.createElement("div");
        body.className = "drawflow-node-body";
        var content = node.content;
        if (content){
            if (typeof content === "string"){
                body.innerHTML = content;
            }
            else{
                body.appendChild(content);
            }
        }
        div.appendChild(body);


      //Create drawflow node
        var tempID = drawflow.addNode(
            node.type,
            node.inputs,
            node.outputs,
            node.position[0],
            node.position[1],
            "",
            {},
            div.outerHTML
        );


      //Get content div after it's been added to drawflow and add custom attributes
        div = document.getElementById(div.id);
        div.name = node.name;
        div.type = node.type;
        div.inputs = {};
        div.outputs = {};
        nodes[nodeID+""] = div;


      //Update node id in the drawflow data
        var data = drawflow.drawflow.drawflow[currModule].data;
        var info = data[tempID];
        info.id = nodeID;
        data[nodeID+""] = info;
        delete data[tempID];
        var contentNode = div.parentNode;
        var drawflowNode = contentNode.parentNode;
        drawflowNode.id = "node_"+nodeID;


      //Return content div
        return div;
    };


  //**************************************************************************
  //** editNode
  //**************************************************************************
    var editNode = function(node){
        if (!nodeEditor){

            nodeEditor = new javaxt.dhtml.Window(document.body, {
                title: "Edit Node",
                width: 400,
                valign: "top",
                modal: true,
                resizable: false,
                style: config.style.window
            });


            var form = new javaxt.dhtml.Form(nodeEditor.getBody(), {
                style: config.style.form,
                items: [
                    {
                        name: "name",
                        label: "Name",
                        type: "text"
                    },
                    {
                        name: "notes",
                        label: "Notes",
                        type: "textarea"
                    }
                ]
            });

            nodeEditor.update = function(data){
                form.clear();
                if (!data) return;
                if (data.name) form.setValue("name", data.name);
                if (data.notes) form.setValue("notes", data.notes);
            };
            nodeEditor.getData = function(){
                return form.getData();
            };
        }


        nodeEditor.update({
            name: node.name,
            notes: node.notes
        });
        nodeEditor.onClose = function(){
            var data = nodeEditor.getData();
            node.name = data.name;
            node.notes = data.notes;
            if (node.name){
                node.name = node.name.trim();
                if (node.name.length>0){
                    node.childNodes[0].getElementsByTagName("span")[0].innerHTML = node.name;
                }
            }
        };


        nodeEditor.show();
    };


  //**************************************************************************
  //** createButton
  //**************************************************************************
    var createButton = function(nodeType, icon, title){


      //Create button
        var btn = new javaxt.dhtml.Button(toolbar, {
            display: "table",
            disabled: true,
            style: {
                button: "drawflow-toolbar-button",
                select: "drawflow-toolbar-button-selected",
                hover: "drawflow-toolbar-button-hover",
                label: "drawflow-toolbar-button-label",
                icon: "drawflow-toolbar-button-icon " + icon
            }
        });


      //Add drawflow specific properties
        btn.el.dataset["node"] = nodeType;
        btn.el.dataset["icon"] = icon;
        btn.el.dataset["title"] = title;
        btn.el.draggable = true;
        btn.el.ondragstart = function(e){
            if (btn.isDisabled()){
                //e.preventDefault();
                return false;
            }
            drag(e);
        };



      //Add tooltip
        btn.el.onmouseover = function(e){
            var button = this;
            if (tooltipTimer) clearTimeout(tooltipTimer);
            if (btn.isEnabled()){

                var showToolTip = function(){
                    var nodeType = button.dataset["node"];
                    var title = button.dataset["title"];
                    var label = "Add " + (title==null ? nodeType : title);
                    tooltip.getInnerDiv().innerHTML = label;
                    var rect = javaxt.dhtml.utils.getRect(button);
                    var rect2 = javaxt.dhtml.utils.getRect(button.parentNode);
                    var x = rect2.x + rect2.width + 3;
                    var y = rect.y + Math.ceil(rect.height/2);
                    tooltip.showAt(x, y, "right", "center");
                    lastToolTipEvent = new Date().getTime();
                };

                var delay = false; //disable delay for now...
                if (lastToolTipEvent){
                    if (new Date().getTime()-lastToolTipEvent<3000) delay = false;
                }
                if (delay){
                    tooltipTimer = setTimeout(showToolTip, 1000);
                }
                else{
                    showToolTip();
                }
            }
        };
        btn.el.onmouseleave = function(){
            tooltip.hide();
        };
        btn.el.onmousedown=function(){
            tooltip.hide();
        };


        button[nodeType] = btn;
        return btn;
    };


  //**************************************************************************
  //** createSankey
  //**************************************************************************
    var createSankey = function(parent){

        var panel = createDashboardItem(parent,{
            width: "1000px",
            height: "644px",
            title: "Untitled",
            settings: false
        });

        var div = panel.el;
        div.className = "dashboard-item";
        div.style.float = "none";

        sankeyChart = new bluewave.charts.SankeyChart(panel.innerDiv,{});
    };


  //**************************************************************************
  //** updateSankey
  //**************************************************************************
    var updateSankey = function(){

        var data = {
            nodes: [],
            links: []
        };


        for (var key in nodes) {
            if (nodes.hasOwnProperty(key)){
                var node = nodes[key];
                var name = node.name;

                data.nodes.push({
                    name: name,
                    group: node.type
                });


                var inputs = node.inputs;
                for (var k in inputs) {
                    if (inputs.hasOwnProperty(k)){
                        var n = nodes[k];
                        var v = quantities[k + "->" + key];
                        //console.log(k + "->" + key, );

                        data.links.push({
                            source: n.name,
                            target: name,
                            value: v
                        });
                    }
                }
            }
        }


        sankeyChart.update(data);
    };


  //**************************************************************************
  //** createToggleButton
  //**************************************************************************
    var createToggleButton = function(parent){

        var div = document.createElement("div");
        div.style.position = "absolute";
        div.style.top = "20px";
        div.style.right = "20px";
        div.style.zIndex = 2;
        parent.appendChild(div);


        var options = ["Edit","Preview"];
        toggleButton = bluewave.utils.createToggleButton(div, {
            options: options,
            defaultValue: options[0],
            onChange: function(val){
                if (val==="Edit"){
                    previewPanel.hide();
                    editPanel.show();
                }
                else{
                    editPanel.hide();
                    previewPanel.show();
                    updateSankey();
                }
            }
        });

        addShowHide(toggleButton);
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var addShowHide = javaxt.dhtml.utils.addShowHide;
    var createDashboardItem = bluewave.utils.createDashboardItem;

    init();
};