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
      .on('locationName -> locationName).as(location.single)
  }

  def byId(id: Long) = DB.withConnection { implicit c =>
    SQL("select * from location where id = {id}")
      .on('id -> id).as(location.singleOpt)
  }

  def findOrCreate(locationName: String) = DB.withConnection { implicit c =>
    SQL("merge into location(name) KEY(name) VALUES ({name})")
      .on('name -> locationName)
      .executeInsert(location.singleOpt) match {
        case Some(loc) => loc
        case None => find(locationName)
      }
  }

  val location = {
    get[Long]("id") ~
      get[String]("name") map {
        case id ~ name => Location(id, name)
      }
  }
}