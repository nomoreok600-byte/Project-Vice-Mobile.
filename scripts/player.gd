extends CharacterBody3D

var camera_pivot: Node3D
var camera: Camera3D

var move_input := Vector2.ZERO
var sprint_pressed := false

var walk_speed := 4.0
var run_speed := 7.0
var jump_force := 6.0
var gravity := 18.0

var camera_yaw := 0.0
var camera_pitch := -0.18

var joystick_running_threshold := 0.82


func _ready() -> void:
	camera_pivot = get_node_or_null("CameraPivot")
	camera = camera_pivot.get_node_or_null("ThirdPersonCamera")


func set_move_input(direction: Vector2) -> void:
	move_input = direction


func rotate_camera(delta: Vector2) -> void:
	camera_yaw -= delta.x * 0.008
	camera_pitch -= delta.y * 0.008
	camera_pitch = clamp(camera_pitch, -0.9, 0.8)


func jump() -> void:
	if is_on_floor():
		velocity.y = jump_force


func _physics_process(delta: float) -> void:
	_update_camera()
	_update_movement(delta)
	move_and_slide()


func _update_camera() -> void:
	rotation.y = camera_yaw

	if camera_pivot:
		camera_pivot.rotation.x = camera_pitch


func _update_movement(delta: float) -> void:
	if not is_on_floor():
		velocity.y -= gravity * delta
	else:
		velocity.y = -0.2

	var moving := move_input.length() > 0.08

	if not moving:
		velocity.x = move_toward(velocity.x, 0.0, 25.0 * delta)
		velocity.z = move_toward(velocity.z, 0.0, 25.0 * delta)
		return

	# PUBG/Free Fire style:
	# Push joystick far enough forward to run automatically.
	var auto_run := move_input.y < -joystick_running_threshold
	var is_running := sprint_pressed or auto_run

	var speed := run_speed if is_running else walk_speed

	var forward := -global_transform.basis.z
	var right := global_transform.basis.x

	var direction := (
		right * move_input.x +
		forward * -move_input.y
	).normalized()

	velocity.x = direction.x * speed
	velocity.z = direction.z * speed

	# Turn player toward movement direction.
	var target_angle := atan2(direction.x, direction.z)
	rotation.y = lerp_angle(rotation.y, target_angle, delta * 12.0)
