package models

import anorm._
import anorm.SqlParser._
import play.api.db._
import play.api.Play.current

case class Location(id: Long, name: String)

object Location {
  def all: List[Location] = DB.withConnection { implicit c =>
    SQL("select * from location").as(location *)
  }

  def find(locationName: String) = DB.withConnection { implicit c =>
    SQL("select * from location where name = {locationName}")
      .on('locationName -> locationName).as(location.singleOpt)
  }

  def insert(locationName: String): Option[Long] = DB.withConnection { implicit c =>
    SQL("insert into location (name) select ({name}) where not exists (select * from location where name = {name})")
      .on('name -> locationName)
      .executeInsert()
  }

  def findOrCreate(locationName: String): Location = DB.withConnection { implicit c =>
    find(locationName)
      .getOrElse(insert(locationName).flatMap(byId) // does not exist yet, create it
        .getOrElse(find(locationName).get)) // someone created it at the same time, re-find by name
  }

  def byId(id: Long): Option[Location] = DB.withConnection { implicit c =>
    SQL("select * from location where id = {id}").on('id -> id).as(location.singleOpt)
  }

  val location = {
    get[Long]("id") ~
      get[String]("name") map {
        case id ~ name => Location(id, name)
      }
  }
}