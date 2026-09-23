extends Control

signal direction_changed(direction: Vector2)

var finger_id := -1
var direction := Vector2.ZERO
var knob_position := Vector2.ZERO

const BASE_RADIUS := 85.0
const KNOB_RADIUS := 30.0


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	queue_redraw()


func _draw() -> void:
	var center := size * 0.5

	draw_circle(center, BASE_RADIUS, Color(1.0, 1.0, 1.0, 0.14))
	draw_arc(center, BASE_RADIUS, 0.0, TAU, 48, Color(1.0, 1.0, 1.0, 0.4), 3.0)

	var knob := center + knob_position
	draw_circle(knob, KNOB_RADIUS, Color(0.25, 0.55, 1.0, 0.8))
	draw_arc(knob, KNOB_RADIUS, 0.0, TAU, 32, Color(0.7, 0.9, 1.0, 0.9), 2.0)


func _gui_input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed and finger_id == -1:
			finger_id = event.index
			_update_from_position(event.position)

		elif not event.pressed and event.index == finger_id:
			finger_id = -1
			direction = Vector2.ZERO
			knob_position = Vector2.ZERO
			direction_changed.emit(direction)
			queue_redraw()

	elif event is InputEventScreenDrag and event.index == finger_id:
		_update_from_position(event.position)


func _update_from_position(position: Vector2) -> void:
	var center := size * 0.5
	var offset := position - center

	if offset.length() > BASE_RADIUS:
		offset = offset.normalized() * BASE_RADIUS

	knob_position = offset
	direction = offset / BASE_RADIUS

	direction_changed.emit(direction)
	queue_redraw()
