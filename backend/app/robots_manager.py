from uuid import UUID

from app.models.all import User

class RobotsManager:
    def __init__(self):
        self.robots: list[User] = []

    def set_robots(self, robot_list: list[User]):
        self.robots = robot_list

    def get_all_robots(self):
        return self.robots

    def is_robot(self, user_id: UUID) -> bool:
        return any(str(robot.id) == str(user_id) for robot in self.robots)

    def get_robot1_id(self):
        if self.robots and len(self.robots) > 0:
            return self.robots[0].id
        return None

    def get_robot2_id(self):
        if self.robots and len(self.robots) > 1:
            return self.robots[1].id
        return None

    def get_robot3_id(self):
        if self.robots and len(self.robots) > 2:
            return self.robots[2].id
        return None

robots_user_manager = RobotsManager()