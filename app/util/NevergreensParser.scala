package util

import scala.xml.Source
import scala.xml.XML
import models.NevergreenResult

object NevergreensParser {
  def parse(nevergreens: String) = {
    val xml = XML.loadString(nevergreens)
    val rows = xml \ "data" \ "row"
    rows.map(row => row.child match {
      case Seq(id, path, name, nrOfFailures, link) => {
        NevergreenResult(
          id.text.toInt,
          path.text,
          name.text,
          nrOfFailures.text.toInt,
          link.text)
      }
    })
  }
}