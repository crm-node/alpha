<div id="addEventModal" class="modal fade" role="dialog">
    <div class="modal-dialog">
    <div class="modal-content">
    <div class="modal-header">
    <button type="button" class="close" data-dismiss="modal">&times;</button>
<h4 class="modal-title">ADD EVENT</h4>
</div>
<div class="modal-body">
    <form class="form-horizontal" role="form" name="eventAddForm">
    <div class="form-group" ng-repeat="field in eventsSchema track by $index">
    <label class="col-sm-2 control-label" for="input{{field.field}}">{{field.title}}</label>
<div class="col-sm-10">
    <input type="{{field.type}}" class="form-control" id="input{{field.field}}"
placeholder="{{field.title}}" ng-model="eventToAdd[''+field.field]"/>
    </div>
    </div>
    </form>
    </div>
    <div class="modal-footer">
    <button type="button" class="btn btn-success" ng-click="addEvent()">ADD</button>
    <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
    </div>
    </div>
    </div>
    </div>

    <div id="confirmDeleteEventModal" class="modal fade" role="dialog">
    <div class="modal-dialog">
    <div class="modal-content">
    <div class="modal-header">
    <button type="button" class="close" data-dismiss="modal">&times;</button>
<h4 class="modal-title">Are you sure you want to delete this event?</h4>
</div>
<div class="modal-footer">
    <button type="button" class="btn btn-success" ng-click="deleteEvent()" data-dismiss="modal">Delete</button>
    <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
    </div>
    </div>
    </div>
    </div>

    <div id="editEventModal" class="modal fade" role="dialog">
    <div class="modal-dialog">
    <div class="modal-content">
    <div class="modal-header">
    <button type="button" class="close" data-dismiss="modal">&times;</button>
<h4 class="modal-title">EDIT EVENT</h4>
</div>
<div class="modal-body">
    <form class="form-horizontal" role="form" name="eventEditForm">
    <div class="form-group" ng-repeat="field in eventsSchema track by $index">
    <label class="col-sm-2 control-label" for="input{{field.field}}">{{field.title}}</label>
<div class="col-sm-10">
    <input type="{{field.type}}" class="form-control" id="input{{field.field}}"
placeholder="{{field.title}}" ng-model="eventToEdit[''+field.field]"/>
    </div>
    </div>
    </form>
    </div>
    <div class="modal-footer">
    <button type="button" class="btn btn-success" ng-click="editEvent()">EDIT</button>
    <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
    </div>
    </div>
    </div>
    </div>