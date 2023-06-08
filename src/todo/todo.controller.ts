import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TodoService } from './todo.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() createTodoDto: CreateTodoDto, @Req() request) {
    createTodoDto.userId = request.user.id;
    return this.todoService.create(createTodoDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  findAll(@Req() request) {
    return this.todoService.getTodosByUserId({
      userId: request.user.id,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.todoService.findOne(+id);
  }

  @Post('search')
  @UseGuards(AuthGuard('jwt'))
  searchTodo(@Req() request, @Body() Body) {
    return this.todoService.searchTodo({
      title: Body.title,
      status: Body.status,
      createdAt: Body.createdAt,
      updatedAt: Body.updatedAt,
      userId: request.user.id,
    });
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTodoDto, @Req() request) {
    return this.todoService.update(+id, updateTaskDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('id') id: string, @Req() request) {
    return this.todoService.remove({ id, userId: request.user.id });
  }

  @Get('undo/:id')
  undoTodo(@Param('id') id: string) {
    return this.todoService.undoTodoById(+id);
  }
}
