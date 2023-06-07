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
  findAll() {
    return this.todoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.todoService.findOne(+id);
  }

  @Post('todosByUserId')
  @UseGuards(AuthGuard('jwt'))
  todosByUserId(@Req() request) {
    return this.todoService.getTodosByUserId({ userId: request.user.id });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTodoDto) {
    return this.todoService.update(+id, updateTaskDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.todoService.remove(+id);
  }

  @Get('undo/:id')
  undoTodo(@Param('id') id: string) {
    return this.todoService.undoTodoById(+id);
  }
}
