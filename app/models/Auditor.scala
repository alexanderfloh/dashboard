package models

import play.api.libs.json._
import play.api.libs.functional.syntax._

case class Auditor(id: Phabricator.UserPHID,
              name: String,
              auditCount: Int = 0,
              concernCount: Int = 0) {
  def hasAuditsOrConcerns = auditCount > 0 || concernCount > 0
}

object Auditor {
  def create(id: Phabricator.UserPHID, name: String): Auditor = Auditor(id, name)
  
  implicit val reads: Reads[Auditor] = (
    (JsPath \ "phid").read[Phabricator.UserPHID] and
    (JsPath \ "realName").read[String]
  )(Auditor.create _)
  
  implicit val writes: Writes[Auditor] = (
      (JsPath \ "phid").write[Phabricator.UserPHID] and
      (JsPath \ "realName").write[String] and
      (JsPath \ "auditCount").write[Int] and
      (JsPath \ "concernCount").write[Int] 
  )(unlift(Auditor.unapply))
}