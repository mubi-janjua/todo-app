import { Injectable, Logger } from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Todo } from './entities/todo.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
@Injectable()
export class TodoService {
  constructor(@InjectRepository(Todo) private readonly todoRepository: Repository<Todo>) {}

  create(createTodoDto: CreateTodoDto) {
    const user = new Todo();

    user.title = createTodoDto.title;
    user.description = createTodoDto.description;
    user.userId = createTodoDto.userId;

    return this.todoRepository.save(user);
  }

  async findAll() {
    const todosWithUserInfo = await this.todoRepository
      .createQueryBuilder('todo')
      .select(['todo.id', 'todo.title', 'todo.description', 'user.id', 'user.name', 'user.email'])
      .leftJoin('todo.user', 'user')
      .getRawMany();

    return todosWithUserInfo.map((row) => ({
      id: row.todo_id,
      title: row.todo_title,
      description: row.todo_description,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
    }));
  }

  async findOne(id: number) {
    const result = await this.todoRepository
      .createQueryBuilder('todo')
      .select(['todo.id', 'todo.title', 'todo.description', 'user.id', 'user.name', 'user.email'])
      .leftJoin('todo.user', 'user')
      .where({ id })
      .getRawOne();

    if (!result) {
      return null;
    }

    return {
      id: result.todo_id,
      title: result.todo_title,
      description: result.todo_description,
      userId: result.user_id,
      userName: result.user_name,
      userEmail: result.user_email,
    };
  }

  async update(id: number, updateTodoDto: UpdateTodoDto) {
    const updatedTodo = await this.todoRepository
      .createQueryBuilder()
      .update(Todo)
      .set(updateTodoDto)
      .where({ id })
      .returning(['id', 'title', 'description'])
      .execute();

    if (!updatedTodo.affected || updatedTodo.affected === 0) {
      return null;
    }

    return {
      id: updatedTodo.raw[0].id,
      title: updatedTodo.raw[0].title,
      description: updatedTodo.raw[0].description,
    };
  }

  async remove(id: number) {
    const todo = await this.todoRepository.findOne({ id });
    if (!todo) {
      return null; // Todo item not found
    }

    todo.deletedAt = new Date();
    await this.todoRepository.save(todo);

    return todo;
  }

  async undoTodoById(id: number) {
    const updatedTodo = await this.todoRepository
      .createQueryBuilder()
      .update(Todo)
      .set({ deletedAt: null })
      .where('deletedAt IS NOT NULL AND id = :id', { id })
      .returning(['id', 'title', 'description'])
      .execute();

    if (!updatedTodo.raw.length) {
      return null; // Todo item not found
    }

    const updatedTodoItem = updatedTodo.raw[0];

    return updatedTodoItem;
  }

  async getTodosByUserId({ userId }) {
    const todosWithUserInfo = await this.todoRepository
      .createQueryBuilder('todo')
      .select(['todo.id', 'todo.title', 'todo.description', 'user.id', 'user.name', 'user.email'])
      .where({ userId })
      .leftJoin('todo.user', 'user')
      .getRawMany();

    return todosWithUserInfo.map((row) => ({
      id: row.todo_id,
      title: row.todo_title,
      description: row.todo_description,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
    }));
  }
}
