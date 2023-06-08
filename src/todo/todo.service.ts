import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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

    if (!updatedTodo) {
      throw new HttpException('Note not found!', HttpStatus.BAD_REQUEST);
    }

    return {
      id: updatedTodo.raw[0].id,
      title: updatedTodo.raw[0].title,
      description: updatedTodo.raw[0].description,
    };
  }

  async remove({ id, userId }) {
    const todo = await this.todoRepository.findOne({ id, userId });
    if (!todo) {
      throw new HttpException('Note not found!', HttpStatus.BAD_REQUEST);
    }

    todo.deletedAt = new Date();
    await this.todoRepository.save(todo);

    return { message: 'Note deleted successfully!' };
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
      throw new HttpException('Note not found!', HttpStatus.BAD_REQUEST);
    }

    return { message: 'Note undo successfully!' };
  }

  async getTodosByUserId({ userId }) {
    const todosWithUserInfo = await this.todoRepository
      .createQueryBuilder('todo')
      .select(['todo.id', 'todo.title', 'todo.description', 'todo.status', 'user.id', 'user.firstName', 'user.email'])
      .where({ userId })
      .leftJoin('todo.user', 'user')
      .orderBy('todo.createdAt', 'DESC')
      .getRawMany();

    return todosWithUserInfo.map((row) => ({
      id: row.todo_id,
      title: row.todo_title,
      description: row.todo_description,
      status: row.todo_status,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
    }));
  }

  async searchTodo({ userId, title, status, createdAt, updatedAt }) {
    const queryBuilder = this.todoRepository.createQueryBuilder('todo');
    queryBuilder.andWhere('todo.userId = :userId', { userId });

    if (title) {
      queryBuilder.andWhere('todo.title ILIKE :title', { title: `%${title}%` });
    }

    if (status) {
      queryBuilder.andWhere('todo.status = :status', { status });
    }

    if (createdAt) {
      queryBuilder.andWhere('DATE(todo.createdAt) = :createdAt', { createdAt });
    }

    if (updatedAt) {
      queryBuilder.andWhere('DATE(todo.updatedAt) = :updatedAt', { updatedAt });
    }

    queryBuilder.leftJoinAndSelect('todo.user', 'user');
    queryBuilder.orderBy('todo.createdAt', 'DESC');

    const todosWithUserInfo = await queryBuilder.getMany();
    return todosWithUserInfo.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      userId: row.user.id,
      userName: row.user.firstName,
      userEmail: row.user.email,
    }));
  }

  // async getTodos(payload) {
  //   if (payload.title && payload.status === null && payload.createdAt === null && payload.updatedAt === null)
  //     return await this.searchTodo(payload);
  //   return await this.getTodosByUserId({ userId: payload.userId });
  // }
}
