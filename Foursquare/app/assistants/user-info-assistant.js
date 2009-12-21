function UserInfoAssistant(a,u,ps) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	   
	   this.auth=a;
	   this.uid=u;
	   this.prevScene=ps;
}

UserInfoAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
			this.getUserInfo();

	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	    this.controller.setupWidget("userSpinner",
         this.attributes = {
             spinnerSize: 'large'
         },
         this.model = {
             spinning: true 
         });
	this.controller.setupWidget(Mojo.Menu.appMenu,
       _globals.amattributes,
       _globals.ammodel);
         
    this.controller.setupWidget(Mojo.Menu.commandMenu,
        this.cmattributes = {
           spacerHeight: 0,
           menuClass: 'no-fade'
        },
    _globals.cmmodel);

	/* add event handlers to listen to events from widgets */
	
	$("uhistory").hide();
}

UserInfoAssistant.prototype.getUserInfo = function() {
	var url = 'http://api.foursquare.com/v1/user.json';
	var request = new Ajax.Request(url, {
	   method: 'get',
	   evalJSON: 'force',
	   requestHeaders: {Authorization:this.auth}, //Not doing a search with auth due to malformed JSON results from it
	   parameters: {uid:this.uid,badges: '1', mayor: '1'},
	   onSuccess: this.getUserInfoSuccess.bind(this),
	   onFailure: this.getUserInfoFailed.bind(this)
	 });
}

UserInfoAssistant.prototype.getUserInfoSuccess = function(response) {
	Mojo.Log.error(response.responseText);
	var j=response.responseJSON;
	this.cookieData=new Mojo.Model.Cookie("credentials");
	var credentials=this.cookieData.get();

	
	//user info
	$("userPic").src=j.user.photo;
	var lname=(j.user.lastname != undefined)? j.user.lastname: "";
	var tw=(j.user.twitter != undefined)? '<img src="images/bird.png" width="16" height="16" /> <a href="http://twitter.com/'+j.user.twitter+'">'+j.user.twitter+'</a><br/>': "";
	var fb=(j.user.facebook != undefined)? '<img src="images/facebook.gif" width="16" height="16" /> <a href="http://facebook.com/profile.php?id='+j.user.facebook+'">Facebook Profile</a><br/>': "";
	var ph=(j.user.phone != undefined)? '<img src="images/phone.png" width="16" height="16" /> <a href="tel://'+j.user.phone+'">'+j.user.phone+'</a><br/>': "";
	var em=(j.user.email != undefined)? '<img src="images/mail.png" width="16" height="16" /> <a href="mailto:'+j.user.email+'">'+j.user.email+'</a><br/>': "";
	
	this.cookieData=new Mojo.Model.Cookie("credentials");
	var credentials=this.cookieData.get();
	if(this.uid != "") { //only show friending options if it's not yourself
	var friendstatus=(j.user.friendstatus != undefined)? j.user.friendstatus: "";

	switch (friendstatus) {
		case "friend":
			var fs='<img src="images/friend.png" width="100" height="35" id="isfriend" alt="Friend" />';
			var fs="You're friends!"
			break;
		case "pendingthem":
			var fs='<img src="images/pending.png" width="100" height="35" id="pendingfriend" alt="Pending" />';
			break;
		case "pendingyou":
			var fs='<img src="images/approve.png" width="100" height="35" id="approvefriend" alt="Approve" /> <img src="images/deny.png" width="100" height="35" id="denyfriend" alt="Deny" />';		
			break;
		default:
			var fs='<img src="images/addfriend.png" width="100" height="35" id="addfriend" alt="Add Friend" />';					
			break;
	}
	}else{
		var fs="";
	}	
	
	fs='<span id="friend_button">'+fs+'</span>';
	
	$("userName").innerHTML=j.user.firstname+" "+lname+"<br class=\"breaker\"/>";
	$("userInfo").innerHTML+=j.user.city.name+"<br/>";
	$("userInfo").innerHTML+=em+ph+tw+fb+fs;
	if(j.user.checkin != undefined) {
		$("userInfo").innerHTML+="<br/>"+j.user.checkin.display;
	}
	
	//assign events to the new button(s)
	if(friendstatus=="pendingyou") {
		Mojo.Event.listen($("approvefriend"),Mojo.Event.tap,this.approveFriend.bind(this));
		Mojo.Event.listen($("denyfriend"),Mojo.Event.tap,this.denyFriend.bind(this));
	}
	if(friendstatus=="") {
		Mojo.Event.listen($("addfriend"),Mojo.Event.tap,this.addFriend.bind(this));
	}

	//user's mayorships
	if(j.user.mayor != null) {
		for(var m=0;m<j.user.mayor.length;m++) {
			$("mayor-box").innerHTML+='<div class="palm-row single"><div class="checkin-score truncating-text"><span>'+j.user.mayor[m].name+'</span></div></div>';
		}
	}else{
		$("mayor-box").innerHTML='<div class="palm-row single"><div class="checkin-badge"><span>'+j.user.firstname+' isn\'t the mayor of anything yet.</span></div></div>';
	}

	//user's badges
	if(j.user.badges != null && credentials.cityid==j.user.city.id) {
		var o='';
		o += '<table border=0 cellspacing=0 cellpadding=2>';
		var id=0
		for(var m=0;m<j.user.badges.length;m++) {
//			$("badges-box").innerHTML+='<div class="palm-row single"><div class="checkin-badge"><img src="'+j.user.badges[m].icon+'" width="48" height="48" style="float:left" /> <span>'+j.user.badges[m].name+'</span><br/><span class="palm-info-text" style="margin-left:0;padding-left:0">'+j.user.badges[m].description+'</span></div></div>';
			id++;
			
			if(id==1) {
				o += '<tr>';
			}
			o += '<td align="center" width="25%" class="medium-text"><img src="'+j.user.badges[m].icon+'" width="48" height="48"/><br/>'+j.user.badges[m].name+'</td>';
			if(id==4) {
				o += '</tr>';
				id=0;
			}
		}
		$("badges-box").innerHTML=o+"</table>";
	}else{
		$("badges-box").innerHTML='<div class="palm-row single"><div class="checkin-badge"><span>'+j.user.firstname+' doesn\'t have any badges in '+credentials.city+' yet.</span></div></div>';
	}


	//if logged in user, show checkin history
	if(this.uid == "") {
		this.getHistory();
	}else{
		$("userScrim").hide();
		$("userSpinner").mojo.stop();
		$("userSpinner").hide();
	}

}

UserInfoAssistant.prototype.getUserInfoFailed = function(response) {
	Mojo.Controller.getAppController().showBanner("Error getting the user's info.", {source: 'notification'});

}

UserInfoAssistant.prototype.approveFriend = function(event) {
	var url = 'http://api.foursquare.com/v1/friend/approve.json';
	var request = new Ajax.Request(url, {
	   method: 'post',
	   evalJSON: 'force',
	   requestHeaders: {Authorization:this.auth}, //Not doing a search with auth due to malformed JSON results from it
	   parameters: {uid:this.uid},
	   onSuccess: this.approveSuccess.bind(this),
	   onFailure: this.approveFailed.bind(this)
	 });
}
UserInfoAssistant.prototype.approveSuccess = function(response) {
	if(response.responseJSON.user != undefined) {
		Mojo.Controller.getAppController().showBanner("Friend request approved!", {source: 'notification'});
		$("friend_button").innerHTML='<img src="images/friend.png" width="100" height="35" id="isfriend" alt="Friend" />';
	}else{
		Mojo.Controller.getAppController().showBanner("Error approving friend request", {source: 'notification'});
	}
}
UserInfoAssistant.prototype.approveFailed = function(response) {
	Mojo.Controller.getAppController().showBanner("Error approving friend request", {source: 'notification'});
}

UserInfoAssistant.prototype.denyFriend = function(event) {
	var url = 'http://api.foursquare.com/v1/friend/deny.json';
	var request = new Ajax.Request(url, {
	   method: 'post',
	   evalJSON: 'force',
	   requestHeaders: {Authorization:this.auth}, //Not doing a search with auth due to malformed JSON results from it
	   parameters: {uid:this.uid},
	   onSuccess: this.denySuccess.bind(this),
	   onFailure: this.denyFailed.bind(this)
	 });
}
UserInfoAssistant.prototype.denySuccess = function(response) {
	if(response.responseJSON.user != undefined) {
		Mojo.Controller.getAppController().showBanner("Friend request denied!", {source: 'notification'});
		$("friend_button").innerHTML='<img src="images/addfriend.png" width="100" height="35" id="addfriend" alt="Add Friend" />';
		Mojo.Event.listen($("addfriend"),Mojo.Event.tap,this.addFriend.bind(this));
	}else{
		Mojo.Controller.getAppController().showBanner("Error denying friend request", {source: 'notification'});
	}
}
UserInfoAssistant.prototype.denyFailed = function(response) {
	Mojo.Controller.getAppController().showBanner("Error denying friend request", {source: 'notification'});
}




UserInfoAssistant.prototype.addFriend = function(event) {
	var url = 'http://api.foursquare.com/v1/friend/sendrequest.json';
	var request = new Ajax.Request(url, {
	   method: 'post',
	   evalJSON: 'force',
	   requestHeaders: {Authorization:this.auth}, //Not doing a search with auth due to malformed JSON results from it
	   parameters: {uid:this.uid},
	   onSuccess: this.addSuccess.bind(this),
	   onFailure: this.addFailed.bind(this)
	 });
}
UserInfoAssistant.prototype.addSuccess = function(response) {
	if(response.responseJSON.user != undefined) {
		Mojo.Controller.getAppController().showBanner("Friend request sent!", {source: 'notification'});
		$("friend_button").innerHTML='<img src="images/pending.png" width="100" height="35" id="pendingfriend" alt="Pending" />';
	}else{
		Mojo.Controller.getAppController().showBanner("Error sending friend request", {source: 'notification'});
	}
}
UserInfoAssistant.prototype.addFailed = function(response) {
	Mojo.Controller.getAppController().showBanner("Error sending friend request", {source: 'notification'});
}


UserInfoAssistant.prototype.getHistory = function(event) {
	Mojo.Log.error("##getting histroy...");
	var url = 'http://api.foursquare.com/v1/history.json';
	var request = new Ajax.Request(url, {
	   method: 'post',
	   evalJSON: 'force',
	   requestHeaders: {Authorization:this.auth}, //Not doing a search with auth due to malformed JSON results from it
	   parameters: {},
	   onSuccess: this.historySuccess.bind(this),
	   onFailure: this.historyFailed.bind(this)
	 });
}

UserInfoAssistant.prototype.historySuccess = function(response) {
Mojo.Log.error("##history:"+response.responseText);

	var j=response.responseJSON;
	
	if(j.checkins != null) {
	$("uhistory").show();
	Mojo.Log.error("##got history...");
		for(var c=0;c<j.checkins.length;c++) {
			var sh=(j.checkins[c].shout != undefined)? '<br/><span class="palm-info-text">'+j.checkins[c].shout+'</span>': "";
			$("history-box").innerHTML+='<div class="palm-row single"><div class="checkin-badge truncating-text"><span>'+j.checkins[c].venue.name+'</span>'+sh+'</div></div>';
		}
	}else{
		$("history-box").innerHTML='<div class="palm-row single"><div class="checkin-badge"><span>No recent check-ins yet.</span></div></div>';
	}

		$("userScrim").hide();
		$("userSpinner").mojo.stop();
		$("userSpinner").hide();

}

UserInfoAssistant.prototype.historyFailed = function(response) {
	Mojo.Log.error("error getting history");
		$("userScrim").hide();
		$("userSpinner").mojo.stop();
		$("userSpinner").hide();

}

UserInfoAssistant.prototype.handleCommand = function(event) {
        if (event.type === Mojo.Event.command) {
            switch (event.command) {
				case "do-Venues":
                	var thisauth=_globals.auth;
					this.controller.stageController.swapScene({name: "nearby-venues", transition: Mojo.Transition.crossFade},thisauth,userData,_globals.username,_globals.password,this.uid);
					//this.prevScene.cmmodel.items[0].toggleCmd="do-Nothing";
				    //this.prevScene.controller.modelChanged(this.prevScene.cmmodel);

					//this.controller.stageController.popScene("user-info");
					break;
				case "do-Friends":
                	var thisauth=_globals.auth;
					this.controller.stageController.swapScene({name: "friends-list", transition: Mojo.Transition.crossFade},thisauth,userData,_globals.username,_globals.password,this.uid);
					break;
                case "do-Badges":
                	//var thisauth=auth;
				//	this.controller.stageController.pushScene({name: "user-info", transition: Mojo.Transition.crossFade},thisauth,"");
                	break;
                case "do-Shout":
                //	var checkinDialog = this.controller.showDialog({
				//		template: 'listtemplates/do-shout',
				//		assistant: new DoShoutDialogAssistant(this,auth)
				//	});
                	var thisauth=this.auth;
					this.controller.stageController.swapScene({name: "shout", transition: Mojo.Transition.crossFade},thisauth,"",this);

                	break;
                case "do-Tips":
                	var thisauth=_globals.auth;
					this.controller.stageController.swapScene({name: "nearby-tips", transition: Mojo.Transition.crossFade},thisauth,"",this);
                	break;
                case "do-Leaderboard":
                	var thisauth=_globals.auth;
					this.controller.stageController.swapScene({name: "leaderboard", transition: Mojo.Transition.crossFade},thisauth,"",this);
                	break;
                case "do-About":
					this.controller.stageController.pushScene({name: "about", transition: Mojo.Transition.crossFade});
                	break;
                case "do-Prefs":
					this.controller.stageController.pushScene({name: "preferences", transition: Mojo.Transition.crossFade});
                	break;
                case "do-Refresh":
					$("userInfo").innerHTML="";
					$("history-box").innerHTML="";
					$("badges-box").innerHTML="";
					$("mayor-box").innerHTML="";
					$("userScrim").show();
					$("userSpinner").mojo.start();
					$("userSpinner").show();
					this.getUserInfo();
                	break;
      			case "do-Nothing":
      				break;
            }
            var scenes=this.controller.stageController.getScenes();
            //Mojo.Log.error("########this scene="+scenes[scenes.length-1].name+", below is "+scenes[scenes.length-2].name);
            //scenes[scenes.length-2].getSceneController().cmmodel.items[0].toggleCmd="do-Nothing";
            //scenes[scenes.length-2].getSceneController().modelChanged(scenes[scenes.length-2].getSceneController().cmmodel);
        }
    }


UserInfoAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	   //this.cmmodel.items[0].toggleCmd="do-Nothing";
	  // this.controller.modelChanged(this.cmmodel);
}

UserInfoAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

UserInfoAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}
