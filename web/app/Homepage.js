if(!bluewave) var bluewave={};

//******************************************************************************
//**  Homepage
//******************************************************************************
/**
 *   Landing page for the app.
 *
 ******************************************************************************/

bluewave.Homepage = function(parent, config) {

    var me = this;
    var mainDiv;
    var t = new Date().getTime();


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){


        var div = document.createElement("div");
        div.className = "dashboard-homepage";
        div.style.height = "100%";
        div.style.textAlign = "center";
        div.style.overflowY = "auto";
        parent.appendChild(div);
        me.el = div;

        var innerDiv = document.createElement("div");
        innerDiv.style.height = "100%";
        div.appendChild(innerDiv);
        mainDiv = innerDiv;


      //Add listiners to the "Dashboard" store
        var dashboards = config.dataStores["Dashboard"];
        dashboards.addEventListener("add", function(dashboard){
            refresh();
        }, me);

        dashboards.addEventListener("update", function(dashboard){
            t = new Date().getTime();
            refresh();
        }, me);

        dashboards.addEventListener("remove", function(dashboard){
            refresh();
        }, me);





    };


  //**************************************************************************
  //** getTitle
  //**************************************************************************
    this.getTitle = function(){
        return "Dashboards";
    };


  //**************************************************************************
  //** onUpdate
  //**************************************************************************
    this.onUpdate = function(){};


  //**************************************************************************
  //** onClick
  //**************************************************************************
    this.onClick = function(dashboard){};


  //**************************************************************************
  //** update
  //**************************************************************************
    this.update = function(){
        refresh();
        me.onUpdate();
    };


  //**************************************************************************
  //** refresh
  //**************************************************************************
    var refresh = function(){
        mainDiv.innerHTML = "";
        var dashboards = config.dataStores["Dashboard"];
        var groups = config.dataStores["DashboardGroup"];

        if (dashboards && groups){
            render();
        }
        else{
            get("dashboard/groups",{
                success: function(groups) {
                    groups = new javaxt.dhtml.DataStore(groups);
                    config.dataStores["DashboardGroup"] = groups;
                    render();
                }
            });
        }
    };


  //**************************************************************************
  //** render
  //**************************************************************************
    var render = function(){
        var dashboards = config.dataStores["Dashboard"];
        var groups = config.dataStores["DashboardGroup"];


      //Create groups as needed
        if (groups.length===0){
            var myDashboards = [];
            var sharedDashboards = [];
            for (var i=0; i<dashboards.length; i++){
                var dashboard = dashboards.get(i);
                if (!dashboard.className || !dashboard.app){
                    myDashboards.push(dashboard.id);
                }
                else{
                    sharedDashboards.push(dashboard.id);
                }
            }
            if (myDashboards.length>0){
                groups = new javaxt.dhtml.DataStore();
                groups.add({
                    name: "My Dashboards",
                    dashboards: myDashboards
                });
                groups.add({
                    name: "Shared Dashboards",
                    dashboards: sharedDashboards
                });
            }
        }


      //Render dashboards by group
        if (groups.length===0){
            for (var i=0; i<dashboards.length; i++){
                var dashboard = dashboards.get(i);
                add(dashboard, mainDiv);
            }
        }
        else{
            for (var i=0; i<groups.length; i++){
                var group = groups.get(i);
                var arr = [];
                if (group.dashboards){
                    for (var j=0; j<group.dashboards.length; j++){
                        var dashboardID = group.dashboards[j];
                        for (var k=0; k<dashboards.length; k++){
                            var dashboard = dashboards.get(k);
                            if (dashboard.id===dashboardID){
                                arr.push(dashboard);
                            }
                        }
                    }
                }
                var g = createGroupBox(group);
                for (var j=0; j<arr.length; j++){
                    add(arr[j], g);
                }
            }
        }
    };


  //**************************************************************************
  //** add
  //**************************************************************************
    var add = function(dashboard, parent){
        var title = dashboard.name;


        var dashboardItem = createDashboardItem(parent, {
            width: 360,
            height: 230,
            subtitle: title
        });


        dashboardItem.innerDiv.style.cursor = "pointer";
        dashboardItem.innerDiv.style.textAlign = "center";
        dashboardItem.innerDiv.onclick = function(){
            me.onClick(dashboard);
        };


        var icon = document.createElement("i");
        icon.className = "fas fa-camera";
        dashboardItem.innerDiv.appendChild(icon);


        var img = document.createElement("img");
        img.className = "noselect";
        img.style.cursor = "pointer";
        img.onload = function() {
            dashboardItem.innerDiv.innerHTML = "";
            dashboardItem.innerDiv.appendChild(this);
        };
        img.src = "dashboard/thumbnail?id=" + dashboard.id + "&_=" + t;
    };


  //**************************************************************************
  //** createGroupBox
  //**************************************************************************
    var createGroupBox = function(group){
        var div = document.createElement("div");
        div.className = "dashboard-group";
        div.style.position = "relative";

        var label = document.createElement("div");
        label.className = "dashboard-group-label";
        label.style.position = "absolute";
        label.innerHTML = group.name;
        div.appendChild(label);

        mainDiv.appendChild(div);
        return div;
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var get = bluewave.utils.get;
    var createDashboardItem = bluewave.utils.createDashboardItem;

    init();
};